# Ad Butler vs TargetVideo: Will They Conflict?

## Quick Answer
✅ **NO CONFLICT** — They work TOGETHER, not compete
⚠️ **But:** Bad setup = frequency capping breaks, impression counts get confused, revenue wrong

---

## How They Should Work

**Ad Butler = Central ad server**
- Controls ALL ads on your platform
- Sets frequency caps (don't show same ad twice)
- Manages bidding & impressions

**TargetVideo = Video player**
- Asks Ad Butler for video ads (pre-roll, mid-roll, outstream)
- Plays what Ad Butler sends
- Reports back impressions

**Result:** One unified system, zero conflicts ✅

---

## ❌ What CAUSES Conflict

```
TargetVideo gets ads from: Provider A (direct VAST tag)
Ad Butler also on page: Provider B
Result:
  ❌ User sees same ad twice
  ❌ Frequency caps broken
  ❌ Impression counts wrong
  ❌ Revenue tracking confused
```

---

## ✅ The Right Setup

1. **Create Ad Butler tags** for video slots:
   - Video Pre-roll tag
   - Video Mid-roll tag
   - Video Outstream tag

2. **Configure TargetVideo** to use ONLY those Ad Butler tags:
   ```
   Pre-roll:  [Ad Butler URL]/video-preroll
   Mid-roll:  [Ad Butler URL]/video-midroll
   Outstream: [Ad Butler URL]/video-outstream
   ```

3. **Set frequency caps in Ad Butler** (not in TargetVideo):
   - Max 5 ads per user per day
   - Max 2 per advertiser per day
   - Applied BEFORE serving to TargetVideo

4. **Test before launch:**
   - Watch 5+ videos
   - Check: Do impression counts match?
   - Check: Does same user see same ad twice?

---

## Checklist Before Going Live

- [ ] Ad Butler tags created for each video slot
- [ ] TargetVideo uses Ad Butler tags (not direct VAST)
- [ ] Frequency caps set in Ad Butler only
- [ ] Fallover configured (what if Ad Butler is down?)
- [ ] Impression tracking verified (numbers match)
- [ ] Revenue tracking verified (payments correct)
- [ ] Tested on staging (5+ videos)

---

## If Problems Happen

| Problem | Cause | Fix |
|---------|-------|-----|
| Same ad shows 2x | TargetVideo bypassing Ad Butler | Use Ad Butler tags only |
| Wrong impression counts | Multiple tracking pixels | Use Ad Butler as single source |
| Revenue lower than expected | Multiple auctions confusing bidders | Unified auction via Ad Butler |
| Ad in video + banner simultaneously | Two independent servers | Enable deduplication in Ad Butler |

---

## Bottom Line

✅ **They won't conflict if:**
- TargetVideo pulls from Ad Butler
- All frequency caps in Ad Butler only
- Single source of truth for impressions

❌ **They will conflict if:**
- TargetVideo uses direct VAST tags
- Multiple ad servers bidding independently
- Frequency capping in multiple places

**One more thing:** Ad Butler handles banners/popups on non-video pages too. No overlap there either ✅
