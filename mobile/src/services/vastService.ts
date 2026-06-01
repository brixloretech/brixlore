/**
 * VAST 2.0/3.0 XML parser for React Native.
 *
 * React Native does not expose DOMParser, so we parse VAST XML using regex.
 * Handles both plain text and CDATA-wrapped content inside XML tags.
 * Does NOT implement VAST wrapper resolution (follows immediate VAST response only).
 */

export interface VastMediaInfo {
  mediaUrl: string;
  mediaCandidates: string[];
  impressionUrls: string[];
  clickThroughUrl: string | null;
  clickTrackingUrls: string[];
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeUrl(raw: string): string {
  let url = decodeXmlEntities(raw).trim();
  if (url.startsWith('//')) url = `https:${url}`;
  if (url.startsWith('http://')) url = `https://${url.slice('http://'.length)}`;
  return url;
}

/**
 * Extracts text content from all occurrences of a given XML tag.
 * Handles CDATA sections: <Tag><![CDATA[value]]></Tag> and plain: <Tag>value</Tag>
 */
function extractAllTagContent(xml: string, tag: string): string[] {
  // Matches opening tag (with optional attributes), then CDATA or plain text, then closing tag.
  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*<\\/${tag}>`,
    'gi',
  );
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    const content = decodeXmlEntities((m[1] ?? m[2] ?? '').trim());
    if (content) results.push(content);
  }
  return results;
}

interface MediaFile {
  url: string;
  mimeType: string;
  bitrate: number;
  width: number;
  height: number;
}

function extractFirstHttpUrl(value: string): string | null {
  const m = value.match(/https?:\/\/[^\s"'<>\]]+/i);
  return m?.[0] ?? null;
}

function isLikelyPlayableMedia(mf: MediaFile): boolean {
  const url = mf.url.toLowerCase();
  const type = mf.mimeType;
  if (url.includes('servedbyadbutler.com/getad.img') && !type.startsWith('video/')) {
    return false;
  }
  if (type.includes('video/mp4')) return true;
  if (type.includes('application/vnd.apple.mpegurl')) return true;
  if (type.includes('application/x-mpegurl')) return true;
  if (type.includes('application/dash+xml')) return true;
  if (type.startsWith('video/')) return true;
  if (url.includes('.mp4')) return true;
  if (url.includes('.m3u8')) return true;
  if (url.includes('.mpd')) return true;
  return false;
}

/**
 * Extracts <MediaFile> entries, preserving the `type` attribute so we can
 * prefer MP4 over other formats.
 */
function extractMediaFiles(xml: string): MediaFile[] {
  const regex = /<MediaFile\b[\s\S]*?<\/MediaFile>/gi;
  const results: MediaFile[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    const block = m[0] ?? '';
    const openTagMatch = block.match(/^<MediaFile([^>]*)>/i);
    const attrs = openTagMatch?.[1] ?? '';

    const inner = block
      .replace(/^<MediaFile[^>]*>/i, '')
      .replace(/<\/MediaFile>$/i, '')
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();

    let url = normalizeUrl(inner);
    if (!/^https?:\/\//i.test(url)) {
      const fallback = extractFirstHttpUrl(block);
      if (fallback) url = normalizeUrl(fallback);
    }

    // Guard against parser mistakes where XML tag text leaks into the URL.
    if (url.includes('<MediaFile')) {
      const fallback = extractFirstHttpUrl(url);
      if (!fallback) continue;
      url = normalizeUrl(fallback);
    }

    if (!url) continue;
    const typeMatch = attrs.match(/\btype="([^"]*)"/i);
    const mimeType = typeMatch ? typeMatch[1].toLowerCase() : '';
    const bitrateMatch = attrs.match(/\b(?:bitrate|minBitrate|maxBitrate)="([0-9]+)"/i);
    const widthMatch = attrs.match(/\bwidth="([0-9]+)"/i);
    const heightMatch = attrs.match(/\bheight="([0-9]+)"/i);
    const bitrate = bitrateMatch ? Number.parseInt(bitrateMatch[1], 10) : 0;
    const width = widthMatch ? Number.parseInt(widthMatch[1], 10) : 0;
    const height = heightMatch ? Number.parseInt(heightMatch[1], 10) : 0;
    results.push({ url, mimeType, bitrate, width, height });
  }
  return results;
}

/**
 * Fire impression tracking pixels.
 * Uses fire-and-forget fetch — failures are silently discarded.
 */
export function fireImpressions(urls: string[]): void {
  for (const url of urls) {
    fetch(url, { method: 'GET' }).catch(() => {
      // Intentionally ignore — impression tracking must not throw
    });
  }
}

/**
 * Fetches a VAST tag URL and parses the XML into a VastMediaInfo object.
 *
 * @param tagUrl   The VAST tag URL (AdButler VAST endpoint)
 * @param timeoutMs  Timeout in milliseconds before aborting
 * @returns VastMediaInfo on success, null on failure (network error, parse error, no MP4)
 */
export async function fetchVastMediaInfo(
  tagUrl: string,
  timeoutMs: number,
): Promise<VastMediaInfo | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(tagUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/xml, text/xml, */*' },
    });

    if (!res.ok) return null;

    const xml = await res.text();
    if (!xml.trim()) return null;

    // Prefer lower-bitrate MP4 for mobile (reduces ad buffering on weak networks).
    // Then fall back to other playable formats.
    const mediaFiles = extractMediaFiles(xml);
    console.log('[VAST] extracted media files', {
      count: mediaFiles.length,
      samples: mediaFiles.slice(0, 5).map(mf => ({
        url: mf.url,
        mimeType: mf.mimeType,
        bitrate: mf.bitrate,
        width: mf.width,
        height: mf.height,
      })),
    });
    const mp4Candidates = mediaFiles
      .filter(mf => mf.mimeType.includes('mp4') || mf.url.toLowerCase().includes('.mp4'))
      .sort((a, b) => {
        const bitA = a.bitrate > 0 ? a.bitrate : Number.MAX_SAFE_INTEGER;
        const bitB = b.bitrate > 0 ? b.bitrate : Number.MAX_SAFE_INTEGER;
        if (bitA !== bitB) return bitA - bitB;
        const hA = a.height > 0 ? a.height : Number.MAX_SAFE_INTEGER;
        const hB = b.height > 0 ? b.height : Number.MAX_SAFE_INTEGER;
        return hA - hB;
      });

    const fallbackCandidates = mediaFiles.filter(isLikelyPlayableMedia);
    const ordered = [...mp4Candidates, ...fallbackCandidates, ...mediaFiles]
      .map(mf => mf.url)
      .filter((url, idx, arr) => arr.indexOf(url) === idx);

    const preferred = ordered[0] ? { url: ordered[0] } : null;
    if (!preferred) return null;
    console.log('[VAST] selected media candidate', {
      selected: preferred.url,
      candidateCount: ordered.length,
    });

    const impressionUrls = extractAllTagContent(xml, 'Impression');
    const clickThroughUrls = extractAllTagContent(xml, 'ClickThrough');
    const clickTrackingUrls = extractAllTagContent(xml, 'ClickTracking');

    return {
      mediaUrl: preferred.url,
      mediaCandidates: ordered,
      impressionUrls,
      clickThroughUrl: clickThroughUrls[0] ?? null,
      clickTrackingUrls,
    };
  } catch {
    // AbortError (timeout) or network failure → no ad
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
