import { AssetDirectories } from './Content';
import { ImageManager } from './ImageManager';

export const trackingImageHandler = new ImageManager(
  { directory: AssetDirectories.trackingImage, webPath: 'content/tracking' },
  {
    image: {
      width: 512,
      height: 512,
      scale: 4,
      description: 'tracking image',
    },
  },
);
