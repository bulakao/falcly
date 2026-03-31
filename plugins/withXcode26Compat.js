const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Xcode 26 compatibility fixes for React Native + Firebase.
 *
 * 1. UIUtilities framework moved to SubFrameworks in iOS 26 SDK → add search path
 * 2. Xcode 26 enables Swift explicit modules by default → disable for RN prebuilts
 *
 * References:
 * - https://github.com/flutter/flutter/issues/171755 (UIUtilities is Apple-side)
 * - https://reactnative.dev/blog/2025/08/12/react-native-0.81 (Xcode 26 notes)
 */
module.exports = function withXcode26Compat(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      const snippet = `
    # [withXcode26Compat] Xcode 26 SDK compatibility
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Disable Swift explicit modules (Xcode 26 default breaks RN prebuilts)
        config.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'

        # Add SubFrameworks search path for UIUtilities (iOS 26 SDK)
        fsp = config.build_settings['FRAMEWORK_SEARCH_PATHS'] || ['$(inherited)']
        fsp = [fsp] if fsp.is_a?(String)
        sub_fw = '"$(SDKROOT)/System/Library/SubFrameworks"'
        fsp << sub_fw unless fsp.include?(sub_fw)
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] = fsp
      end
    end`;

      podfile = podfile.replace(
        /(react_native_post_install\([\s\S]*?\n\s*\))/,
        `$1\n${snippet}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);
};
