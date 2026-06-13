@echo off
REM Build standalone release APK/AAB for Play Store (no Metro needed on phone)
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Removing duplicate drawable assets (Metro bundles these on release build)...
powershell -NoProfile -Command "Get-ChildItem -Path 'android\app\src\main\res' -Recurse -Filter 'node_modules_*' -ErrorAction SilentlyContinue | Remove-Item -Force"
echo.
echo Building release AAB for Play Store...
cd android
set GRADLE_USER_HOME=C:\gradle-home
call gradlew.bat bundleRelease --no-daemon
if errorlevel 1 (
  echo BUILD FAILED - see errors above
  pause
  exit /b 1
)
echo.
echo SUCCESS! Upload this file to Google Play Console:
echo %cd%\app\build\outputs\bundle\release\app-release.aab
echo.
echo For direct phone install (testing), also run:
echo gradlew.bat assembleRelease
echo APK: app\build\outputs\apk\release\app-release.apk
pause
