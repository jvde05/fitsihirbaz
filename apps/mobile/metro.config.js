// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm workspace monorepo desteği: kök node_modules'daki paketleri (packages/shared gibi)
// çözebilmesi için Metro'ya izlenecek klasörü ve sembolik link takibini bildiriyoruz.
// disableHierarchicalLookup KULLANILMIYOR: pnpm'in .pnpm/<pkg>/node_modules yapısı, iç
// bağımlılıkların (örn. @expo/metro-runtime -> @expo/log-box) çözülmesi için hiyerarşik
// aramaya ihtiyaç duyuyor; devre dışı bırakılırsa bu paketler bulunamıyor.
config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
