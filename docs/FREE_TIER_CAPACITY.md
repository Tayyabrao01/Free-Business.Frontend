# How many users can your app handle? (Free Stream + Cloudinary + Hostinger)

This is practical guidance for your **current stack**, not a hard guarantee. Real limits depend on usage patterns (how many posts, calls, messages per user).

## Your stack

| Service | Role | Free / starter typical limits |
|---------|------|-------------------------------|
| **Hostinger** (Node + MongoDB) | API, auth, posts, properties | Shared CPU/RAM — often **50–200** active users at once on cheap plans; **500+** daily users if light |
| **Stream Chat** (free) | Messaging | ~**1,000 MAU** on maker/free tiers; concurrent connections limited |
| **Stream Video** (free) | Calls | Limited **minutes** and **concurrent calls** (often ~**5–25** concurrent on free) |
| **Cloudinary** (free) | Images/videos | **25 credits/month**, bandwidth cap — fine for early stage, not heavy video |

## Safe targets for smooth operation (free tier)

| Metric | Comfortable | Risky |
|--------|-------------|--------|
| **Registered users (total)** | Up to **1,000–3,000** | 10,000+ without paid plans |
| **Online at the same time** | **30–80** | 200+ |
| **Active video calls at once** | **3–10** pairs | 20+ |
| **New posts + property images per day** | **50–200** uploads | 1,000+ heavy videos |

## What causes crashes or slowness first

1. **Too many simultaneous video calls** → Stream Video limit  
2. **Large videos uploaded to Cloudinary** → quota + slow load  
3. **Hostinger CPU maxed** → API slow, timeouts, app “errors”  
4. **MongoDB on same small VPS** → slow lists (posts/properties)  
5. **No Firebase push** → calls don’t ring (not a crash, but looks broken)

## How to grow without crashes

1. **Upgrade Stream** when you have regular calls (paid video + chat).  
2. **Upgrade Cloudinary** or compress images/videos before upload (you already resize images in app).  
3. **Upgrade Hostinger** VPS when API feels slow (2 GB+ RAM, 2 vCPU).  
4. **Use CDN** for media (Cloudinary already does).  
5. **Rate limit** heavy endpoints on backend (you have basic rate limits).  
6. **Monitor** `/api/health` and server CPU in Hostinger panel.

## Rule of thumb

- **Launch / testing:** 20–50 daily active users is fine.  
- **Small business community:** plan paid Stream + bigger Hostinger before **500+** daily actives.  
- **“Won’t crash”** = keep concurrent calls low, backend deployed, release APK tested — not unlimited users on free tiers.

## When to upgrade (signs)

- Calls fail often at peak time  
- Images fail to upload  
- App loading posts takes 10+ seconds  
- Stream dashboard shows MAU or minutes exceeded  
- Hostinger shows 90%+ CPU constantly  
