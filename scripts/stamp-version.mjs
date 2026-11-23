#!/usr/bin/env node
/**
 * Stamps the release tag's version into the manifests that feed artifact names.
 *
 * electron-builder derives ${version} (and therefore
 * StudyAssistant-Setup-<version>.exe) from apps/desktop/package.json, so a tag
 * that does not bump the manifests publishes an installer named after the
 * previous release. The release workflow runs this with the tag before building,
 * which keeps every artifact name on the same version.
 *
 * Usage: node scripts/stamp-version.mjs v0.3.0
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MANIFESTS = ["package.json", "apps/desktop/package.json"];

const raw = process.argv[2];
if (!raw) {
  console.error("Usage: node scripts/stamp-version.mjs <version|tag>");
  process.exit(1);
}

const version = raw.trim().replace(/^v/, "");
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Not a semver release version: ${raw}`);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const relative of MANIFESTS) {
  const file = join(root, relative);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const previous = manifest.version;
  if (previous === version) {
    console.log(`${relative}: already ${version}`);
    continue;
  }
  manifest.version = version;
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`${relative}: ${previous} -> ${version}`);
}
