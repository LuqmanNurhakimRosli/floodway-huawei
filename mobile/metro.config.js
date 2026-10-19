// Metro also watches the web app's source, so the app can import the shared, UI-free modules (report rules, flood
// levels, mappers, types) from frontend/src instead of keeping copies. Only pure TypeScript modules may be imported
// from there: nothing that touches the DOM, Leaflet, three.js or lucide-react. See src/shared.ts.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const webSrc = path.resolve(projectRoot, '../frontend/src');
const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders ?? []), webSrc];
// any package a shared file needs resolves from the mobile app first
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
module.exports = config;
