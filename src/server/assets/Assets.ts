import path from 'path';

import { config } from 'server/Config';

export const AssetDirectories = {
  profileImage: path.join(config.assetPath, 'img/profile'),
  shortcutImage: path.join(config.assetPath, 'img/shortcut'),
};
