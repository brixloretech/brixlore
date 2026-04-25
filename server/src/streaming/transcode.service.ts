import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync, readdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';

type ProbeInfo = {
  width?: number;
  height?: number;
  fps?: number;
};

type RenditionPreset = {
  label: string;
  height: number;
  videoBitrate: string;
  maxRate: string;
  bufSize: string;
  audioBitrate: string;
};

const HLS_RENDITION_PRESETS: RenditionPreset[] = [
  {
    label: '2160p',
    height: 2160,
    videoBitrate: '14000k',
    maxRate: '18000k',
    bufSize: '28000k',
    audioBitrate: '192k',
  },
  {
    label: '1080p',
    height: 1080,
    videoBitrate: '6000k',
    maxRate: '7800k',
    bufSize: '12000k',
    audioBitrate: '160k',
  },
  {
    label: '720p',
    height: 720,
    videoBitrate: '3200k',
    maxRate: '4200k',
    bufSize: '6400k',
    audioBitrate: '128k',
  },
  {
    label: '480p',
    height: 480,
    videoBitrate: '1500k',
    maxRate: '2000k',
    bufSize: '3000k',
    audioBitrate: '96k',
  },
];

function getContentType(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (lower.endsWith('.ts')) return 'video/MP2T';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  return undefined;
}

function getUploadPrefixFromKey(key: string): string | null {
  const match = key.replace(/^\/+/, '').match(/^uploads\/([^/]+)\//);
  if (!match) return null;
  return `uploads/${match[1]}/hls`;
}

@Injectable()
export class TranscodeService {
  private readonly logger = new Logger(TranscodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  async transcodeEpisodeToHls(
    episodeId: string,
    opts?: {
      outputPrefix?: string;
      tempDir?: string;
      keepTemp?: boolean;
    },
  ): Promise<{ episodeId: string; hlsKey: string; files: number }> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { id: true, videoUrl: true },
    });

    if (!episode?.videoUrl) {
      throw new BadRequestException('Episode videoUrl is required for transcode');
    }

    const outputPrefix = opts?.outputPrefix?.trim() || getUploadPrefixFromKey(episode.videoUrl);
    if (!outputPrefix) {
      throw new BadRequestException(
        'outputPrefix is required when videoUrl does not use uploads/<id>/',
      );
    }

    const baseTemp = opts?.tempDir?.trim() || path.join(process.cwd(), 'tmp', 'hls');
    const jobDir = path.join(baseTemp, `${episodeId}-${Date.now()}`);
    const outputDir = path.join(jobDir, 'out');
    mkdirSync(outputDir, { recursive: true });

    const sourceKey = episode.videoUrl.trim();
    const sourceUrl = /^https?:\/\//i.test(sourceKey)
      ? sourceKey
      : await this.r2Service.getSignedGetUrl(sourceKey);

    const sourcePath = path.join(jobDir, 'source.mp4');
    await this.downloadToFile(sourceUrl, sourcePath);

    const probeInfo = await this.probeVideo(sourcePath);
    await this.runFfmpeg(sourcePath, outputDir, probeInfo);

    const files = this.listOutputFiles(outputDir);
    if (!files.includes('master.m3u8')) {
      throw new BadRequestException('HLS output missing master.m3u8');
    }

    try {
      for (const file of files) {
        const normalized = file.replace(/\\/g, '/');
        const key = `${outputPrefix.replace(/\/+$/, '')}/${normalized}`;
        const filePath = path.join(outputDir, file);
        await this.r2Service.uploadFile(key, filePath, getContentType(file));
      }

      const hlsKey = `${outputPrefix.replace(/\/+$/, '')}/master.m3u8`;
      await this.prisma.episode.update({
        where: { id: episodeId },
        data: { hlsUrl: hlsKey },
      });

      return { episodeId, hlsKey, files: files.length };
    } finally {
      if (!opts?.keepTemp) {
        try {
          await this.deleteDir(jobDir);
        } catch {
          // ignore cleanup failures
        }
      }
    }
  }

  private async downloadToFile(url: string, destPath: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      throw new BadRequestException(`Failed to download source: ${res.status}`);
    }
    await pipeline(res.body, createWriteStream(destPath));
  }

  private runFfmpeg(sourcePath: string, outputDir: string, probeInfo?: ProbeInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      const { profile, level } = this.selectProfileAndLevel(probeInfo);
      const threadCount = this.getThreadCount();
      const fps = this.sanitizeFps(probeInfo?.fps);
      const keyint = Math.max(24, Math.min(120, Math.round(fps * 2)));
      const preset = process.env.FFMPEG_PRESET?.trim() || 'veryfast';
      const crf = process.env.FFMPEG_CRF?.trim() || '23';
      const renditions = this.resolveRenditions(probeInfo);

      for (let i = 0; i < renditions.length; i += 1) {
        mkdirSync(path.join(outputDir, `v${i}`), { recursive: true });
      }

      const splitOutputs = renditions.map((_, idx) => `[v${idx}]`).join('');
      const filterParts = [`[0:v]split=${renditions.length}${splitOutputs}`];

      for (let i = 0; i < renditions.length; i += 1) {
        const rendition = renditions[i];
        filterParts.push(
          `[v${i}]scale=w=-2:h=${rendition.height}:flags=lanczos:force_original_aspect_ratio=decrease,scale=w=trunc(iw/2)*2:h=trunc(ih/2)*2[v${i}out]`,
        );
      }

      const args: string[] = [
        '-y',
        '-i',
        sourcePath,
        '-filter_complex',
        filterParts.join(';'),
        '-pix_fmt',
        'yuv420p',
        '-threads',
        String(threadCount),
        '-max_muxing_queue_size',
        '4096',
      ];

      for (let i = 0; i < renditions.length; i += 1) {
        const rendition = renditions[i];
        args.push(
          '-map',
          `[v${i}out]`,
          '-map',
          '0:a:0?',
          '-c:v:' + i,
          'libx264',
          '-preset',
          preset,
          '-crf',
          crf,
          '-profile:v:' + i,
          profile,
          '-level:v:' + i,
          level,
          '-g',
          String(keyint),
          '-keyint_min',
          String(keyint),
          '-sc_threshold',
          '0',
          '-b:v:' + i,
          rendition.videoBitrate,
          '-maxrate:v:' + i,
          rendition.maxRate,
          '-bufsize:v:' + i,
          rendition.bufSize,
          '-c:a:' + i,
          'aac',
          '-b:a:' + i,
          rendition.audioBitrate,
          '-ac:a:' + i,
          '2',
          '-ar:a:' + i,
          '48000',
        );
      }

      const varStreamMap = renditions
        .map((rendition, idx) => `v:${idx},a:${idx},name:${rendition.label}`)
        .join(' ');

      args.push(
        '-f',
        'hls',
        '-hls_time',
        '6',
        '-hls_playlist_type',
        'vod',
        '-hls_list_size',
        '0',
        '-hls_flags',
        'independent_segments',
        '-hls_segment_filename',
        path.join(outputDir, 'v%v', 'seg_%03d.ts'),
        '-master_pl_name',
        'master.m3u8',
        '-var_stream_map',
        varStreamMap,
        path.join(outputDir, 'v%v', 'index.m3u8'),
      );

      let ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';
      if (process.platform !== 'win32' && (ffmpegBin.includes('\\') || ffmpegBin.includes('C:'))) {
        ffmpegBin = 'ffmpeg';
      }

      this.logger.log(
        `Starting ffmpeg adaptive transcode (${probeInfo?.width ?? '?'}x${probeInfo?.height ?? '?'} @ ${fps.toFixed(2)}fps, renditions=${renditions.map((r) => r.label).join(', ')}, profile=${profile}, level=${level}, threads=${threadCount})`,
      );

      const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      const stderrTail: string[] = [];

      proc.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.trim()) this.logger.debug(text.trim());
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        if (!text) return;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        for (const line of lines) {
          stderrTail.push(line);
          if (stderrTail.length > 80) stderrTail.shift();
          this.logger.debug(line);
        }
      });

      proc.on('error', (err) => reject(err));

      proc.on('close', (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }

        const reason = signal
          ? `ffmpeg exited with code ${code} (signal: ${signal})`
          : `ffmpeg exited with code ${code}`;
        const details = stderrTail.length
          ? `\nffmpeg stderr (last ${stderrTail.length} lines):\n${stderrTail.join('\n')}`
          : '';
        reject(new BadRequestException(`${reason}${details}`));
      });
    });
  }

  private async probeVideo(sourcePath: string): Promise<ProbeInfo | undefined> {
    const ffprobeBin = this.getFfprobeBin();
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,r_frame_rate',
      '-of',
      'json',
      sourcePath,
    ];

    try {
      const output = await new Promise<string>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const proc = spawn(ffprobeBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

        proc.stdout?.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });

        proc.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });

        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve(stdout);
          else reject(new Error(stderr || `ffprobe exited with ${code}`));
        });
      });

      const parsed = JSON.parse(output) as {
        streams?: Array<{ width?: number; height?: number; r_frame_rate?: string }>;
      };
      const stream = parsed.streams?.[0];
      if (!stream) return undefined;

      return {
        width: stream.width,
        height: stream.height,
        fps: this.parseFps(stream.r_frame_rate),
      };
    } catch (err) {
      this.logger.warn(
        `Unable to probe input video with ffprobe (${ffprobeBin}). Falling back to defaults. ${String(err)}`,
      );
      return undefined;
    }
  }

  private getFfprobeBin(): string {
    let configured = process.env.FFPROBE_PATH?.trim();
    if (!configured) {
      const ffmpeg = process.env.FFMPEG_PATH?.trim();
      if (ffmpeg) {
        configured = ffmpeg.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
      }
    }

    let ffprobeBin = configured || 'ffprobe';
    if (process.platform !== 'win32' && (ffprobeBin.includes('\\') || ffprobeBin.includes('C:'))) {
      ffprobeBin = 'ffprobe';
    }
    return ffprobeBin;
  }

  private selectProfileAndLevel(probeInfo?: ProbeInfo): {
    profile: 'main' | 'high';
    level: string;
  } {
    const width = probeInfo?.width ?? 1920;
    const height = probeInfo?.height ?? 1080;
    const maxDim = Math.max(width, height);

    if (maxDim >= 3840 || height >= 2160) {
      return { profile: 'high', level: '5.1' };
    }
    if (maxDim >= 2560 || height >= 1440) {
      return { profile: 'high', level: '5.0' };
    }
    if (maxDim >= 1920 || height >= 1080) {
      return { profile: 'high', level: '4.1' };
    }
    if (maxDim >= 1280 || height >= 720) {
      return { profile: 'main', level: '3.1' };
    }
    return { profile: 'main', level: '3.0' };
  }

  private getThreadCount(): number {
    const configured = process.env.FFMPEG_THREADS?.trim();
    if (!configured) return 2;
    const n = Number(configured);
    if (!Number.isFinite(n)) return 2;
    return Math.max(1, Math.min(16, Math.floor(n)));
  }

  private parseFps(raw?: string): number | undefined {
    if (!raw) return undefined;
    const [numRaw, denRaw] = raw.split('/');
    const num = Number(numRaw);
    const den = Number(denRaw || '1');
    if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return undefined;
    const fps = num / den;
    if (!Number.isFinite(fps) || fps <= 0) return undefined;
    return fps;
  }

  private sanitizeFps(fps?: number): number {
    if (!fps || !Number.isFinite(fps)) return 30;
    return Math.max(10, Math.min(120, fps));
  }

  private async deleteDir(targetDir: string): Promise<void> {
    if (!existsSync(targetDir)) return;
    await import('fs/promises').then((fs) => fs.rm(targetDir, { recursive: true, force: true }));
  }

  private listOutputFiles(dirPath: string): string[] {
    const results: string[] = [];
    const stack: string[] = [''];

    while (stack.length > 0) {
      const relDir = stack.pop() ?? '';
      const absDir = path.join(dirPath, relDir);
      const entries = readdirSync(absDir, { withFileTypes: true });

      for (const entry of entries) {
        const relPath = relDir ? path.join(relDir, entry.name) : entry.name;
        if (entry.isDirectory()) {
          stack.push(relPath);
        } else if (entry.isFile()) {
          results.push(relPath);
        }
      }
    }

    return results;
  }

  private resolveRenditions(probeInfo?: ProbeInfo): RenditionPreset[] {
    const sourceHeight = probeInfo?.height;
    if (!sourceHeight || !Number.isFinite(sourceHeight)) {
      return HLS_RENDITION_PRESETS.filter((preset) => preset.height <= 1080);
    }

    const resolved = HLS_RENDITION_PRESETS.filter((preset) => preset.height <= sourceHeight + 4);
    if (resolved.length > 0) return resolved;

    const fallbackHeight = Math.max(144, Math.floor(sourceHeight));
    const evenHeight = fallbackHeight % 2 === 0 ? fallbackHeight : fallbackHeight - 1;
    return [
      {
        label: `${evenHeight}p`,
        height: evenHeight,
        videoBitrate: '900k',
        maxRate: '1200k',
        bufSize: '1800k',
        audioBitrate: '96k',
      },
    ];
  }
}
