# Signing

Artifacts are unsigned by default. Nothing here is needed to run the wrapper.

## Windows

Provide `WIN_CSC_LINK` (base64 PFX or https URL) and `WIN_CSC_KEY_PASSWORD` in the repository
secrets; `electron-builder` signs the installer when they exist and builds an unsigned one
otherwise. Windows SmartScreen warns about unsigned installers. A self-signed certificate is
for internal testing only.

## Android

No release signing is wired up yet, so the release workflow builds the debug-signed APK
(`:app:assembleDebug`) for testing. `:app:assembleRelease` would produce an unsigned APK that
cannot be installed. To sign:

1. Create a keystore once and back it up offline — losing it means you can never update the
   app on Play:
   ```bash
   keytool -genkeypair -v -keystore release.jks -alias studyassistant \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add a `signingConfigs.release` block to `apps/android/android/app/build.gradle` reading
   `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and
   `ANDROID_KEY_PASSWORD` from the environment, and point `buildTypes.release` at it. The
   generated project is git-ignored, so this edit has to be applied by the workflow after
   `cap add android` (or by committing the native project instead of ignoring it).
3. Add `ANDROID_KEYSTORE_BASE64` (from `base64 -w0 release.jks`) plus the three password
   values as repository secrets and decode the keystore to `$RUNNER_TEMP/release.jks` in CI.
