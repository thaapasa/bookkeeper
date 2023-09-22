import path from 'path';

import { config } from 'server/Config';

export const AssetDirectories = {
  profileImage: path.join(config.contentPath, 'content/profile'),
  shortcutImage: path.join(config.contentPath, 'content/shortcut'),
};
