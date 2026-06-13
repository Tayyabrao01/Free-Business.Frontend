# Play Store release build (AAB)

See **PLAY_STORE_PUBLISH.md** for the full Play Console step-by-step guide.

## Quick build

```bat
cd frontendApp
BUILD_PLAYSTORE_APK.bat
```

Output (upload to Play Console):

`android/app/build/outputs/bundle/release/app-release.aab`

## Signing

Keystore: `android/app/my-upload-key.keystore`  
Settings: `android/gradle.properties` (`MYAPP_UPLOAD_*`)

**Back up the keystore file and passwords.** You need the same key for every update.

## Version

- App: **1.3.0** (versionCode **11**) — bump in `android/app/build.gradle` before each Play upload
- Backend: deploy **2.3.1+** — https://apps.freebusinessgip.com/api/health

## Play Store requirements (already in project)

| Requirement | Status |
|-------------|--------|
| targetSdk 34 | Yes |
| Privacy policy URL | https://apps.freebusinessgip.com/privacy |
| Account deletion in app | Profile → Delete account |
| HTTPS API | https://apps.freebusinessgip.com/api |
| Release AAB signing | Configured |

## Test on phone before Play upload

```bat
cd android
gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

## Optional: call push when app is closed

Add `google-services.json` to `android/app/` — see `RINGING_CALLS_SETUP.md`
