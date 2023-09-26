import path, { basename } from 'path';
import sharp from 'sharp';

import { FileUploadResult, withoutExt } from 'server/server/FileHandling';

import { AssetDirectories } from './Content';
import { writeImageToFile } from './ImageService';

const ShortcutImageSize = 128;

export async function createShortcutIcons(image: FileUploadResult, margin: number) {
  const basefile = withoutExt(basename(image.filename));
  const filename = basefile + '.webp';
  const filepath = path.join(AssetDirectories.shortcutImage, basefile + '.webp');
  const marginPx = margin * 4;
  const targetSize = ShortcutImageSize - marginPx;
  await writeImageToFile(
    sharp(image.filepath)
      .trim()
      .resize({
        width: targetSize,
        height: targetSize,
        fit: 'contain',
        background: 'transparent',
      })
      .extend({
        top: marginPx,
        bottom: marginPx,
        left: marginPx,
        right: marginPx,
        background: 'transparent',
      })
      .webp(),
    filepath,
    'shortcut icon',
  );
  return filename;
}
