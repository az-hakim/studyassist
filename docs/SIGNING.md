# Signing

Artifacts are unsigned by default. Nothing here is needed to run the wrapper.

## Windows

Provide `WIN_CSC_LINK` (base64 PFX or https URL) and `WIN_CSC_KEY_PASSWORD` in the repository
secrets; `electron-builder` signs the installer when they exist and builds an unsigned one
otherwise. Windows SmartScreen warns about unsigned installers. A self-signed certificate is
for internal testing only.

## Android

### Version

Capacitor generates `versionCode 1` / `versionName "1.0"` and never touches them again, so the
release workflow derives both from the tag and writes them into the generated project before
building — otherwise Android would refuse to install a second build over the first:

| Tag | versionName | versionCode |
| --- | --- | --- |
| `v0.2.0` | `0.2.0` | `200` |
| `v0.3.1` | `0.3.1` | `301` |
| `v1.4.2-rc.1` | `1.4.2-rc.1` | `10402` |

The formula is `major * 10000 + minor * 100 + patch`; minor and patch must stay below 100, and
the tag must be semver (`vX.Y.Z`, optionally with a pre-release suffix). versionCodes must
always increase, so never reuse or lower a tag that has already shipped.

### Signing

The workflow builds a **release-signed** APK (`:app:assembleRelease`) when the keystore secrets
below exist, and falls back to the debug-signed APK (`:app:assembleDebug`) when
`ANDROID_KEYSTORE_BASE64` is not set — for example on a fork, or until you create a keystore.
Debug-signed APKs are fine for sideloading and testing but cannot be uploaded to Google Play.

| Secret name | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the whole keystore, base64 encoded on one line (`base64 -w0 release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | alias of the signing key inside the keystore |
| `ANDROID_KEY_PASSWORD` | password for that key |

All four belong together: when `ANDROID_KEYSTORE_BASE64` is set but any of the other three is
missing, the run fails instead of quietly publishing an unsigned APK.

The keystore is decoded to `$RUNNER_TEMP/release.jks`, then
`apps/android/scripts/configure-android-project.mjs` appends a block to
`apps/android/android/app/build.gradle` that sets `versionCode`/`versionName` and, when a
keystore is supplied, a `signingConfigs.release` used by `buildTypes.release`. The generated
Android project is git-ignored and patched again on every run, so no secret is ever committed.

The release asset is always `StudyAssistant-<version>.apk` (the tag without its leading `v`,
matching `StudyAssistant-Setup-<version>.exe`), whether it was release-signed or fell back to
the debug build; the `Collect APK` step prints the signer certificate so the CI log shows which
one it was.

### Setting it up

1. Create a keystore once and back it up offline — losing it means you can never update the app
   on Play:
   ```bash
   keytool -genkeypair -v -keystore release.jks -alias studyassistant \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Encode it and add the four secrets under Settings → Secrets and variables → Actions:
   ```bash
   base64 -w0 release.jks
   ```
3. Tag a release (`git tag v0.3.0 && git push origin v0.3.0`); the workflow picks the secrets up
   automatically and the uploaded APK is release-signed.

Verify a downloaded APK with the Android build tools:

```bash
apksigner verify --print-certs StudyAssistant-0.3.0.apk
```

The `Collect APK` step also runs that command, so the signer certificate is printed in the CI log
for every release. To exercise the same patch locally:

```bash
pnpm --filter @studyassistant/android add:platform
node apps/android/scripts/configure-android-project.mjs --version 0.3.0 \
  --keystore ~/release.jks --store-password "$STORE_PASSWORD" \
  --key-alias studyassistant --key-password "$KEY_PASSWORD"
cd apps/android/android && ./gradlew assembleRelease
```

Drop the `--keystore` arguments to patch the version only and build a debug APK.
