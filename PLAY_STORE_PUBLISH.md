# Publish Free Business on Google Play Store

Your app **can** go on the Play Store. The project already has:

- Release signing keystore (`android/app/my-upload-key.keystore`)
- **AAB** build script (`BUILD_PLAYSTORE_APK.bat`)
- Package name: `pk.freebusinessik.app` (must match Play Console)
- App name: **Free Business**
- targetSdk **34** (Play requirement)
- Privacy policy URL: https://apps.freebusinessgip.com/privacy
- In-app account deletion: **Profile → Delete account**
- Production API: https://apps.freebusinessgip.com/api

Current app version in code: **1.3.0** (versionCode **11**)

---

## Before you upload (important)

| Step | Action |
|------|--------|
| 1 | Deploy backend **v2.3.2+** on Hostinger (registration + Stream + avatar fixes) |
| 2 | Confirm https://apps.freebusinessgip.com/api/health shows `"ok": true` |
| 3 | Confirm https://apps.freebusinessgip.com/privacy opens in browser |
| 4 | Test register, chat, and calls on **release APK** on 2 phones |
| 5 | (Optional) Add `google-services.json` for incoming call push when app is closed |

---

## Step 1 — Build the AAB (Play Store file)

On your PC:

```bat
cd frontendApp
BUILD_PLAYSTORE_APK.bat
```

When it succeeds, upload this file (not the APK):

```
frontendApp\android\app\build\outputs\bundle\release\app-release.aab
```

**Note:** You cannot install an AAB directly on a phone. Use the APK from `assembleRelease` only for testing.

---

## Step 2 — Google Play Console account

1. Go to https://play.google.com/console
2. Sign in with a Google account
3. Pay the **one-time $25** developer registration fee (if not paid yet)
4. Complete identity / developer profile

---

## Step 3 — Create the app

1. **Create app**
2. App name: **Free Business**
3. Default language: English (add Urdu later if you want)
4. App or game: **App**
5. Free or paid: **Free**
6. Accept policies

---

## Step 4 — Store listing (main store listing)

Prepare these **before** submitting:

| Item | What to use |
|------|-------------|
| **Short description** (80 chars) | Real estate, messaging, groups & rewards in one app |
| **Full description** (4000 chars) | Features: properties, posts, groups, chat, audio/video calls, rewards, referrals |
| **App icon** | 512×512 PNG (use your logo) |
| **Feature graphic** | 1024×500 PNG (banner for Play Store) |
| **Phone screenshots** | At least **2** (recommended 4–8) from a real phone |
| **Category** | Business or House & Home |
| **Contact email** | support@freebusinessgip.com |
| **Privacy policy URL** | https://apps.freebusinessgip.com/privacy |

Screenshot tips: Home, Properties, Messages, Profile.

---

## Step 5 — App content (required forms)

### Privacy policy
- URL: `https://apps.freebusinessgip.com/privacy`

### App access
- If login is required: select **All functionality requires login** and provide test credentials for Google reviewers:

```
Email: reviewer@example.com  (create a real test account on your server)
Password: (your test password)
```

Create a **demo account** on your live server for reviewers.

### Ads
- Select **No** (unless you added ads)

### Content rating
- Start questionnaire → likely **Everyone** or **Teen** depending on user-generated content
- Answer honestly about messaging / user content

### Target audience
- Select age groups (e.g. 18+ if real estate / business focus)

### Data safety
Declare what you collect (typical for this app):

| Data | Collected | Purpose |
|------|-----------|---------|
| Name, email | Yes | Account |
| Photos / videos | Yes | Profile, posts, properties, chat |
| Messages | Yes | Chat (Stream) |
| Location (city) | Optional | Profile |
| Device ID / push token | Yes if Firebase | Call notifications |

- Data is **encrypted in transit** (HTTPS)
- Users can **request account deletion** in app

### Account deletion
- Play requires deletion: **Yes, in-app**
- Path: **Profile → Delete account**
- Also mention: support@freebusinessgip.com

---

## Step 6 — Release → Production

1. Left menu: **Release → Production** (or **Testing → Internal testing** first)
2. **Create new release**
3. Upload **app-release.aab**
4. Release name: `1.3.0 (11)` or similar
5. Release notes example:

```
- User registration and login
- Browse properties and posts
- Groups and rewards
- WhatsApp-style messaging
- Audio and video calls
- Bug fixes and stability
```

6. **Review release** → **Start rollout to Production**

---

## Step 7 — Signing (Play App Signing)

Google will ask about **Play App Signing**:

- Choose **Use Google Play App Signing** (recommended)
- Upload your **upload key** (the keystore you use to sign the AAB)

**Keep `my-upload-key.keystore` safe.** If you lose it, you cannot update the app with the same package name.

**Security:** Do not share keystore passwords publicly. Change passwords in `gradle.properties` if they were ever exposed.

---

## Step 8 — Review time

- First review: often **1–7 days**
- Google may email if they need a demo login or policy fix
- Check **Policy status** and **Publishing overview** in Play Console

---

## Internal testing (recommended first)

Before production:

1. **Release → Testing → Internal testing**
2. Upload the same AAB
3. Add your Gmail as tester
4. Open the opt-in link on your phone and install from Play Store
5. Test everything, then promote to Production

---

## New Play policy (personal accounts)

If your Google Play **personal developer account** was created after **Nov 13, 2023**, Google requires extra testing before production launch:

1. Use a testing track first (usually **Closed testing** with required number of testers)
2. Meet minimum testing duration / engagement shown in Play Console
3. Complete Production access request when Play allows it

Check your app dashboard for the exact requirement shown for your account type.

---

## Checklist summary

- [ ] Backend live (health OK)
- [ ] Privacy URL works
- [ ] AAB built (`app-release.aab`)
- [ ] Play Console app created
- [ ] Store listing + screenshots
- [ ] Data safety form completed
- [ ] Demo account for reviewers
- [ ] AAB uploaded to Internal or Production
- [ ] Keystore backed up safely

---

## Common rejections and fixes

| Issue | Fix |
|-------|-----|
| Privacy policy missing | Use https://apps.freebusinessgip.com/privacy |
| Login required but no test account | Add reviewer credentials in App access |
| Account deletion | Already in Profile → Delete account |
| targetSdk too low | Already 34 in project |
| Crashes on review | Test release APK; fix before resubmit |

---

## Need help later?

After upload, if Google rejects with a specific reason, copy the email text and fix that item only.
