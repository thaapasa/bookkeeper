import { Request } from 'express';
import path from 'path';

import { config } from 'server/Config';
import { logger } from 'server/Logger';
import { getRandomFilename } from 'server/util/random';

export interface FileUploadResult {
  originalFilename?: string;
  filename: string;
  filepath: string;
  sizeInBytes: number;
}

export function getNewFilename(ext?: string): string {
  const base = getRandomFilename(24);
  return ext ? `${base}${ext}` : base;
}

export async function storeUploadedFile(
  req: Request,
  originalFilename?: string,
): Promise<FileUploadResult> {
  const ext = originalFilename ? path.extname(originalFilename) : '';
  const filename = getNewFilename(ext);
  const filepath = path.join(config.fileUploadPath, filename);
  logger.debug(`Saving uploaded file to ${filepath}`);
  const sizeInBytes = await Bun.write(filepath, req.body);
  logger.debug(`Uploaded file ${filepath} saved, ${sizeInBytes} bytes written`);
  return {
    originalFilename,
    filename,
    filepath,
    sizeInBytes,
  };
}
