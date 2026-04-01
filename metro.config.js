const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// Force drizzle-orm ESM imports (.js) to resolve to CJS (.cjs) since Metro
// doesn't fully support ESM "type": "module" packages with relative .js imports
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.endsWith('.js') &&
    context.originModulePath?.includes('drizzle-orm')
  ) {
    const cjsName = moduleName.replace(/\.js$/, '.cjs');
    return context.resolveRequest(context, cjsName, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
