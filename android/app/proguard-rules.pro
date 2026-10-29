# Firebase / Google Play Services
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Notifee
-keep class app.notifee.** { *; }
-dontwarn app.notifee.**

# React Native Firebase
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Stream Chat + Video + WebRTC
-keep class io.getstream.** { *; }
-dontwarn io.getstream.**
-keep class com.streamvideo.reactnative.** { *; }
-keep class com.streamvideo.** { *; }
-dontwarn com.streamvideo.**
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# OkHttp / networking
-dontwarn okhttp3.**
-dontwarn okio.**

# Revopush / CodePush OTA
-keep class com.microsoft.codepush.react.** { *; }
-dontwarn com.microsoft.codepush.react.**

-dontwarn android.app.ApplicationStartInfo
