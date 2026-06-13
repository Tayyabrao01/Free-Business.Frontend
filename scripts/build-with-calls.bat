@echo off
REM Install Android SDK Platform 34 once, then build APK with voice/video calls.
set SDK=%LOCALAPPDATA%\Android\Sdk
set SM=%SDK%\cmdline-tools\latest\bin\sdkmanager.bat
if exist "%SM%" (
  echo Installing platforms;android-34 ...
  echo y| "%SM%" "platforms;android-34" "build-tools;34.0.0"
)
cd /d "%~dp0..\android"
set GRADLE_USER_HOME=C:\gradle-home
powershell -Command "(Get-Content build.gradle) -replace 'compileSdkVersion = 33','compileSdkVersion = 34' | Set-Content build.gradle"
call gradlew.bat assembleDebug
echo APK: android\app\build\outputs\apk\debug\app-debug.apk
pause
