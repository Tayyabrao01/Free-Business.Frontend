# Incoming call ringtone — step by step

Your app already rings when it is **open or in background** (logged in). To hear a ringtone like WhatsApp when someone calls, complete the steps below.

---

## Part 1 — Ring when app is open (no Firebase yet)

### Step 1: Build and install latest APK

```bat
cd frontendApp
BUILD_PLAYSTORE_APK.bat
```

Or for quick phone test:

```bat
cd frontendApp\android
gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

### Step 2: Test on two phones

| Step | Phone A (caller) | Phone B (callee) |
|------|------------------|------------------|
| 1 | Install latest APK | Install latest APK |
| 2 | Register / login | Register / login |
| 3 | Wait 10 seconds on home screen | Same |
| 4 | Messages → open chat with B → tap **Video** or **Audio** call | Should hear ring / see **Incoming call** |
| 5 | B taps **Accept** | Call connects |

**Phone settings for B:**

- Volume (media / ring) turned up  
- Do Not Disturb **off**  
- App notifications **allowed** for Free Business  

---

## Part 2 — Ring when app is closed (Firebase push)

Without Firebase, Android will **not** ring reliably if the app was swiped away or killed.

### Step 1: Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/)
2. **Add project** (or use existing)
3. Click **Add app** → **Android**
4. Package name: **`com.freebusinessapp`** (must match exactly)
5. Download **`google-services.json`**

### Step 2: Put file in the app

Copy the file to:

```
frontendApp/android/app/google-services.json
```

### Step 3: Stream dashboard (push provider)

1. Open [Stream Dashboard](https://dashboard.getstream.io/)
2. Select your **Video** app (same API key as the app)
3. Go to **Chat** → **Push notifications** (or Video push settings)
4. Add provider type **Firebase (FCM)**
5. Upload Firebase **service account JSON** or follow Stream’s FCM wizard
6. Note the **provider name** (often `firebase`)

### Step 4: Match app config

Edit `frontendApp/config/streamConfig.js`:

```javascript
export const STREAM_ANDROID_PUSH_PROVIDER = 'firebase';
```

Use the **exact** name from the Stream dashboard.

### Step 5: Install dependencies and rebuild

```bat
cd frontendApp
npm install
cd android
gradlew.bat assembleRelease
```

Install the new APK on **both** phones.

### Step 6: Allow notifications

On each phone:

1. Open **Settings** → **Apps** → **Free Business**
2. **Notifications** → Allow all
3. Open the app once and accept the notification permission popup

### Step 7: Register device token with Stream

The app registers FCM on login (`NotificationSetup.js`). After login:

1. Kill and reopen the app once  
2. Log in again  
3. Wait ~10 seconds  

### Step 8: Test closed-app ring

| Step | Phone A | Phone B |
|------|---------|---------|
| 1 | Login | Login |
| 2 | — | Press Home (app in background) **or** swipe app away |
| 3 | Call B from chat | B should get **notification + ring** |
| 4 | — | Tap notification → Accept call |

---

## Part 3 — Troubleshooting

| Problem | What to do |
|---------|------------|
| No ring, only UI when app open | Rebuild APK; both users logged in; wait 10s after login |
| No sound, only screen | Turn up volume; disable DND |
| No ring when app closed | Add `google-services.json`; Stream Firebase provider; rebuild |
| `Network Error` on profile photo | Deploy backend **2.3.2+**; use smaller photo; check internet |
| Registration fails on phone fields | Deploy latest `backend` folder to Hostinger |

---

## What the code does

- **Outgoing call:** `call.ring()` in `streamClientService.js`
- **Incoming UI:** `StreamRingingWatcher` + `RingingCallContent`
- **Push when closed:** Firebase + `STREAM_ANDROID_PUSH_PROVIDER`
- **Louder call audio:** `utils/callAudio.js` on active call

---

## Deploy checklist before users test

- [ ] Upload latest `backend/` to Hostinger → restart Node  
- [ ] `https://apps.freebusinessgip.com/api/health` shows version **2.3.2**  
- [ ] New APK/AAB built after frontend changes  
- [ ] `google-services.json` in place (for closed-app ring)  
- [ ] Stream dashboard Firebase provider configured  
