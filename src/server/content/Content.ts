import path from 'path';

import { config } from 'server/Config';

export const AssetDirectories = {
  profileImage: path.join(config.contentPath, 'profile'),
  shortcutImage: path.join(config.contentPath, 'shortcut'),
  trackingImage: path.join(config.contentPath, 'tracking'),
  groupingImage: path.join(config.contentPath, 'grouping'),
};
