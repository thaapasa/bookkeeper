import path, { extname } from 'path';
import sharp from 'sharp';

import { assertDefined, typedKeys } from 'shared/util';
import { FileUploadResult, safeDeleteFile, withoutExt } from 'server/server/FileHandling';

import { FileWriteResult, writeImageToFile } from './ImageService';

export interface ImageSpecData {
  width: number;
  height: number;
  suffix?: string;
  description?: string;
}

export interface ImageSpec<K extends string> extends ImageSpecData {
  /** Name of this variant */
  variant: K;
  /** Filename (just the base name) */
  filename: string;
  /** Full file path to the file on disk */
  filepath: string;
  /** Web path under which the image can be shown */
  webPath: string;
}

export interface ImageManagerOptions {
  /** Directory where images of this type are stored */
  directory: string;
  /** Web path where these images can be accessed from */
  webPath: string;
}

type StringKey<V> = keyof V & string;

export class ImageManager<V extends Record<string, ImageSpecData>> {
  constructor(
    private options: ImageManagerOptions,
    private variantInfos: V,
  ) {}

  get variants(): StringKey<V>[] {
    return typedKeys(this.variantInfos) as StringKey<V>[];
  }

  getVariant = <K extends StringKey<V>>(variant: K, name: string): ImageSpec<K> => {
    const base = stripFilename(name);
    const ext = path.extname(name);
    return this.toVariant(variant, base, ext);
  };

  getVariants = (name: string): ImageSpec<StringKey<V>>[] => {
    const base = stripFilename(name);
    const ext = path.extname(name);
    return this.variants.map(k => this.toVariant(String(k), base, ext));
  };

  async saveImages(file: FileUploadResult) {
    const writtenFiles: FileWriteResult[] = [];
    try {
      for (const v of this.variants) {
        writtenFiles.push(await this.saveImage(v, file));
      }
      const first = writtenFiles[0];
      assertDefined(first);
      return stripFilename(first.filepath) + extname(first.filepath);
    } catch (e) {
      // Clean up possibly created files
      await Promise.all(writtenFiles.map(f => safeDeleteFile(f.filepath)));
      throw e;
    }
  }

  async deleteImages(filename: string) {
    for (const v of this.getVariants(filename)) {
      await safeDeleteFile(v.filepath);
    }
  }

  private async saveImage<K extends StringKey<V>>(
    variant: K,
    file: FileUploadResult,
  ): Promise<FileWriteResult> {
    const info = this.getVariant(variant, file.filename);
    return await writeImageToFile(
      sharp(file.filepath)
        .trim()
        .resize({
          width: info.width,
          height: info.height,
          fit: 'contain',
          background: 'transparent',
        })
        .webp(),
      info.filepath,
      info.description ?? info.variant,
    );
  }

  private toVariant<K extends StringKey<V>>(
    variant: K,
    basename: string,
    ext: string,
  ): ImageSpec<K> {
    const v = this.variantInfos[variant];
    const filename = `${basename}${v.suffix ? '-' + v.suffix : ''}${ext}`;
    return {
      ...v,
      variant,
      filename,
      filepath: path.join(this.options.directory, filename),
      webPath: path.join(this.options.webPath, filename),
    };
  }
}

function stripFilename(filename: string) {
  const base = withoutExt(path.basename(filename));
  const suffixPos = base.lastIndexOf('-');
  return suffixPos > 0 ? base.substring(0, suffixPos) : base;
}
