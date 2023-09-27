import { AssetDirectories } from './Content';
import { ImageManager } from './ImageManager';

export const shortcutImageHandler = new ImageManager(
  { directory: AssetDirectories.shortcutImage, webPath: 'content/shortcut' },
  {
    icon: { width: 128, height: 128, scale: 4, description: 'shortcut icon' },
  },
);
