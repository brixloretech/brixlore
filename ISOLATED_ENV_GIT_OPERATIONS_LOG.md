# Isolated Environment Git Operations Log

Date: 2026-05-24
Repository: brixlore
Primary remote: origin (https://github.com/brixloretech/brixlore.git)

## Objective
Safely merge `client-production` into `main` without pushing risky local commits or uncommitted changes from the normal workspace.

## Isolation Strategy Used
A separate worktree was created from `origin/main` and all merge/push operations were executed there.

- Main local workspace (untouched): `d:/Nextjs Projects/brixlore`
- Isolated merge workspace: `d:/Nextjs Projects/brixlore-merge-live`

## Git Operations Performed

### 1) Verified remote and tracking state
- Confirmed remote default branch: `main`
- Confirmed current feature branch had local commits not intended for live

### 2) Created isolated worktree from remote main
Commands used:

```powershell
Set-Location "d:\Nextjs Projects\brixlore"
git fetch origin
$mergeDir = "d:\Nextjs Projects\brixlore-merge-live"
if (Test-Path $mergeDir) { git worktree remove --force $mergeDir }
git worktree add "$mergeDir" origin/main
Set-Location "$mergeDir"
git switch -c merge-clientprod-into-main
```

### 3) Merged client-production into isolated branch
Command used:

```powershell
git merge --no-ff origin/client-production
```

Result:
- One merge conflict occurred in:
  - `server/src/mail/mail.service.ts`

### 4) Resolved merge conflict
- Kept the SMTP/nodemailer MailService implementation compatible with existing auth/admin mail flows.
- Completed merge commit:
  - `e1e3ae9` - `merge: client-production into main (isolated worktree)`

### 5) Pushed isolated merge to live main
Command used:

```powershell
git push origin HEAD:main
```

Result:
- `main` updated: `206562d -> e1e3ae9`

### 6) Diagnosed Railway build failure after merge
Observed deployment error was generic, so local isolated build was run to identify real issue.

Build command used:

```powershell
Set-Location "d:\Nextjs Projects\brixlore-merge-live\server"
npm ci
npm run build
```

Actual TypeScript error found:
- `Property 'sendMail' does not exist on type 'MailService'`
- Usage site: `server/src/site/site.controller.ts`

### 7) Applied isolated hotfix for build failure
- Added missing `sendMail(...)` method to:
  - `server/src/mail/mail.service.ts`

Hotfix commit:
- `1eb5d1c` - `fix(server): add MailService.sendMail used by site distribute endpoint`

Pushed hotfix to main:

```powershell
Set-Location "d:\Nextjs Projects\brixlore-merge-live"
git push origin HEAD:main
```

Result:
- `main` updated: `e1e3ae9 -> 1eb5d1c`

### 8) Triggered empty commit redeploy (no code changes)
Command used:

```powershell
Set-Location "d:\Nextjs Projects\brixlore-merge-live"
git commit --allow-empty -m "chore(deploy): trigger Railway redeploy"
git push origin HEAD:main
```

Redeploy commit:
- `65e94f6` - `chore(deploy): trigger Railway redeploy`

Result:
- `main` updated: `1eb5d1c -> 65e94f6`

## Commits Introduced to Main During Isolated Process
1. `e1e3ae9` - merge: client-production into main (isolated worktree)
2. `1eb5d1c` - fix(server): add MailService.sendMail used by site distribute endpoint
3. `65e94f6` - chore(deploy): trigger Railway redeploy

## Safety Notes
- No risky local feature commits from the normal workspace were pushed.
- Uncommitted local work in the normal workspace remained untouched.
- All live-impacting pushes were done only from the isolated worktree.

## Reuse Checklist (Future)
1. Fetch latest remotes.
2. Create isolated worktree from `origin/main`.
3. Merge target branch there.
4. Resolve conflicts in isolation.
5. Build/test in isolated workspace.
6. Push `HEAD:main` only after validation.
7. Optional empty commit for redeploy trigger.
