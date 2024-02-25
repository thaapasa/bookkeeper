import { AssetDirectories } from './Content';
import { ImageManager } from './ImageManager';

export const groupingImageHandler = new ImageManager(
  { directory: AssetDirectories.groupingImage, webPath: 'content/grouping' },
  {
    image: {
      width: 512,
      height: 512,
      scale: 4,
      description: 'grouping image',
    },
  },
);
