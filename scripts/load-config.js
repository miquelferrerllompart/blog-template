/**
 * load-config.js — Shared config reader for all build scripts
 *
 * Reads site.config.json and exports the parsed config object.
 * Used by: build.sh (via node -e), og-image.js, render.js, analytics-snapshot.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'site.config.json');

if (!fs.existsSync(configPath)) {
    console.error('ERROR: site.config.json not found. Run the onboarding skill or copy site.config.example.json to site.config.json');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

module.exports = config;
