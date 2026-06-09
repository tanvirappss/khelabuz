# Android APK Build & Compile Guide

This document describes how to configure environment variables, setup signing keys, and compile a production-ready signed release APK.

---

## 1. Environment Configurations

1. **OneSignal App ID Binding**:
   - Open [WorldCupApplication.kt](file:///c:/Users/Admin/Downloads/football%20app/android/app/src/main/java/com/worldcup2026/liveapp/WorldCupApplication.kt).
   - Locate the initialization code block:
     `OneSignal.initWithContext(this, "YOUR_ONESIGNAL_APP_ID")`
   - Replace `"YOUR_ONESIGNAL_APP_ID"` with your actual App ID retrieved from the OneSignal console under Settings -> Keys & IDs.

2. **Supabase API Binding**:
   - Open [SupabaseConfig.kt](file:///c:/Users/Admin/Downloads/football%20app/android/app/src/main/java/com/worldcup2026/liveapp/data/remote/SupabaseConfig.kt).
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` to connect the client directly to your cloud project instead of local fallback sandbox databases.

---

## 2. Generating Android Keystore

For release builds, you must sign the application package. Generate a keystore file using `keytool`:

```bash
keytool -genkey -v -keystore worldcup-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias worldcup-key
```

Save the file `worldcup-release-key.jks` in the `/android/app/` directory.

---

## 3. Configuring Gradle Signing Properties

1. Create a `keystore.properties` file inside `/android/` with the following variables:
   ```properties
   storeFile=worldcup-release-key.jks
   storePassword=your-keystore-password
   keyAlias=worldcup-key
   keyPassword=your-key-password
   ```
2. The `app/build.gradle` is pre-configured to bind release builds.

---

## 4. Compiling the APK

Using the gradle wrapper, run compilation commands from the `/android/` root:

```bash
# Navigate to Android folder
cd android

# Clean existing build caches
./gradlew clean

# Compile release APK
./gradlew assembleRelease
```

The successfully built release APK will be located at:
`/android/app/build/outputs/apk/release/app-release.apk`
