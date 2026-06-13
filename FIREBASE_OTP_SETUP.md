# Fix OTP login — Firebase setup (Pakistan +92)

Your error:

`auth/operation-not-allowed` … **SMS unable to be sent until this region enabled**

This is **not an app bug**. Firebase must be configured for **Phone** sign-in and **Pakistan (PK)** SMS.

Project in app: **`free-business-e7b3c`** · Package: **`com.freebusinessapp`**

---

## Step 1 — Enable Phone sign-in

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project **free-business-e7b3c**
3. **Build** → **Authentication** → **Sign-in method**
4. Click **Phone** → turn **Enable** ON → **Save**

---

## Step 2 — Allow Pakistan for SMS (required for +92)

1. Same project → **Authentication**
2. Open the **Settings** tab (gear at top of Authentication)
3. Find **SMS region policy** (or **Phone** → **SMS regions**)
4. Choose **Allow** (allowlist), not “Deny all”
5. Add country: **Pakistan (PK)**
6. **Save**

Without this step, numbers like `+923065655637` will fail with the exact error you saw.

---

## Step 3 — Add Android SHA fingerprints (required on real devices)

1. Firebase Console → **Project settings** (gear) → **Your apps**
2. Select Android app **com.freebusinessapp**
3. Add **SHA-1** and **SHA-256** (debug + release if you use Play signing)

Get debug SHA on your PC (from `frontendApp`):

```powershell
cd "C:\Users\tayya\OneDrive\Desktop\Free Business\frontendApp\android"
$env:GRADLE_USER_HOME="C:\gradle-home"
.\gradlew.bat signingReport
```

Copy **SHA1** and **SHA-256** under `Variant: debug` → paste into Firebase → **Save**.

Download the **new** `google-services.json` and replace:

`frontendApp/android/app/google-services.json`

Then rebuild and reinstall the APK.

---

## Step 4 — Backend (after OTP works on phone)

On Hostinger `.env` set Firebase Admin for your server:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Or path to the service account JSON file. Without this, OTP may verify in Firebase but login to your API can fail.

---

## Step 5 — Rebuild app

```powershell
cd "C:\Users\tayya\OneDrive\Desktop\Free Business\frontendApp\android"
$env:GRADLE_USER_HOME="C:\gradle-home"
.\gradlew.bat assembleRelease --no-daemon
adb install -r "app\build\outputs\apk\release\app-release.apk"
```

---

## Test

1. Use full international number: **`+923001234567`** (always include `+92`)
2. **OTP Login** → **Send OTP**
3. Enter SMS code → login

**Until Firebase is fixed:** use **Password Login** on the same screen.

---

## Still failing?

| Symptom | Fix |
|--------|-----|
| Same `operation-not-allowed` | Phone still disabled or PK not in SMS regions |
| `invalid-phone-number` | Use `+92` and 10 digits after country code |
| `too-many-requests` | Wait 15–30 minutes; avoid spamming Send OTP |
| OTP sends but app login fails | Fix `FIREBASE_SERVICE_ACCOUNT_JSON` on backend |
| Works on emulator, not phone | Add release SHA-1 from Play Console / upload keystore |

Firebase SMS quotas: Spark plan has limits; heavy use may need **Blaze** billing enabled (pay-as-you-go for SMS).
