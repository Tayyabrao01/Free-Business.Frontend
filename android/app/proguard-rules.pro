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
