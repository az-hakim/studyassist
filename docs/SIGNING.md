# Signing

> These steps are performed once by the owner. **Never commit** keystores, certificates or
> passwords. Add them as GitHub Actions secrets.

## Android

1. Generate the release keystore (Java 17+):

   ```bash
   keytool -genkeypair -v -keystore release.jks -alias studybuddy \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Back it up offline in two places. **If the keystore is lost, you can never update the same
   Play Store listing again.**

3. Encode it for GitHub (single line, no wrapping):

   ```bash
   base64 -w0 release.jks    # Linux
   base64 -i release.jks     # macOS
   ```

4. Add repository secrets:

   | Secret | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | the base64 string from step 3 |
   | `ANDROID_KEYSTORE_PASSWORD` | keystore password |
   | `ANDROID_KEY_ALIAS` | `studybuddy` (or your alias) |
   | `ANDROID_KEY_PASSWORD` | key password |

5. The Gradle config reads `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` from the environment, so no credentials are
   written into the repository.

### Versioning

- `versionCode` = `GITHUB_RUN_NUMBER`
- `versionName` = tag without the `v` prefix (e.g. `v0.1.0` → `0.1.0`)

## Windows

A trusted Authenticode certificate is required for a warning-free install. Options:

- **Azure Trusted Signing** — cheapest managed option, integrates with `electron-builder`.
- **SignPath Foundation** — free for qualifying open-source projects.
- A standard OV/EV code-signing certificate exported as `.pfx`.

Add secrets:

| Secret | Value |
|---|---|
| `WIN_CSC_LINK` | base64 of the `.pfx`, or an https URL electron-builder can download |
| `WIN_CSC_KEY_PASSWORD` | certificate password |
| `vars.REQUIRE_WIN_SIGNATURE` | `true` once signing is configured |

While `REQUIRE_WIN_SIGNATURE` is unset, CI builds the installer unsigned, logs the signature
status and **does not fail**. Windows SmartScreen will warn users about unsigned builds; that
is expected and documented in the release notes.

### Verifying locally

```powershell
Get-AuthenticodeSignature .\StudyAssistant-Setup-0.1.0.exe
```

## What CI verifies

- `apksigner verify --print-certs` on the release APK (Android job).
- `Get-AuthenticodeSignature` on every produced `.exe` (Windows job), failing only when
  `REQUIRE_WIN_SIGNATURE=true`.
