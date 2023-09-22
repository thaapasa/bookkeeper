import sharp from 'sharp';

import { logger } from 'server/Logger';

export interface FileWriteResult {
  filepath: string;
  size: number;
}

export async function writeImageToFile(
  image: sharp.Sharp,
  filepath: string,
  title: string,
): Promise<FileWriteResult> {
  const res = await image.toFile(filepath);
  logger.info(`Wrote ${title} to ${filepath}: ${res.size} bytes`);
  return { filepath, size: res.size };
}
