import path, { basename } from 'path';
import sharp from 'sharp';

import { FileUploadResult, withoutExt } from 'server/server/FileHandling';

import { AssetDirectories } from './Content';
import { writeImageToFile } from './ImageService';

const ShortcutImageSize = 128;

export async function createShortcutIcons(image: FileUploadResult) {
  const basefile = withoutExt(basename(image.filename));
  const filename = basefile + '.webp';
  const filepath = path.join(AssetDirectories.shortcutImage, basefile + '.webp');
  await writeImageToFile(
    sharp(image.filepath)
      .trim()
      .resize({
        width: ShortcutImageSize,
        height: ShortcutImageSize,
        fit: 'contain',
        background: 'transparent',
      })
      .webp(),
    filepath,
    'shortcut icon',
  );
  return filename;
}
