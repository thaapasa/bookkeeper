import { Request, Response } from 'express';
import { mkdir, unlink } from 'fs';
import { writeFile } from 'fs/promises';
import multipart from 'parse-multipart-data';
import path from 'path';
import { ITask } from 'pg-promise';
import { promisify } from 'util';

import { BkError, SessionBasicInfo } from 'shared/types';
import { config } from 'server/Config';
import { AssetDirectories } from 'server/content/Content';
import { logger } from 'server/Logger';
import { getRandomFilename } from 'server/util/Random';

import { HandlerParams } from './RequestHandling';

const mkdirAsync = promisify(mkdir);
const unlinkAsync = promisify(unlink);

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

export function withoutExt(file: string): string {
  const ext = path.extname(file);
  return ext ? file.substring(0, file.length - ext.length) : file;
}

export function replaceExt(file: string, extension: string): string {
  return withoutExt(file) + extension;
}

export async function safeDeleteFile(filepath: string, logInfo?: boolean) {
  try {
    const f = Bun.file(filepath);
    if (!(await f.exists())) {
      logger.debug(`File ${filepath} does not exist, skipping delete`);
      return;
    }
    (logInfo ? logger.info : logger.debug)(`Deleting file ${filepath}`);
    await unlinkAsync(filepath);
  } catch (e) {
    logger.warn(e, `Could not delete file ${filepath}`);
  }
}

export async function storeUploadedFile(
  data: Buffer,
  expectedSizeInBytes: number,
  originalFilename?: string,
): Promise<FileUploadResult> {
  const ext = originalFilename ? path.extname(originalFilename) : '';
  const filename = getNewFilename(ext);
  const filepath = path.join(config.fileUploadPath, filename);
  let sizeInBytes = expectedSizeInBytes;
  if (config.useNodeFileAPI) {
    logger.debug(`Saving uploaded file to ${filepath} using Node API`);
    await writeFile(filepath, data);
  } else {
    logger.debug(`Saving uploaded file to ${filepath} using Bun API`);
    sizeInBytes = await Bun.write(filepath, data);
  }
  logger.debug(`Uploaded file ${filepath} saved, ${sizeInBytes} bytes written`);
  return {
    originalFilename,
    filename,
    filepath,
    sizeInBytes,
  };
}

/**
 * @param handler the handler that is called once the uploaded file has been written to a temp file
 */
export function processFileUpload<Return, P, Q>(
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    file: FileUploadResult,
    params: HandlerParams<P, Q, unknown>,
  ) => Promise<Return>,
) {
  return async (
    tx: ITask<any>,
    session: SessionBasicInfo,
    data: HandlerParams<P, Q, unknown>,
    req: Request,
    _res: Response,
  ): Promise<Return> => {
    const boundary = multipart.getBoundary(req.header('content-type') ?? '');
    const parts = multipart.parse(req.body, boundary);

    const filePart = parts.find(p => p.filename);
    if (!filePart) {
      throw new BkError('FILE_MISSING', 'No file in upload data!', 400);
    }

    logger.info(`Received uploaded image ${filePart.filename} of size ${filePart.data.length}`);

    const res = await storeUploadedFile(filePart.data, filePart.data.length, filePart.filename);
    return handler(tx, session, res, data);
  };
}

export async function setupFileDirectories() {
  logger.debug(`Creating asset file directories`);
  for (const dir of Object.values(AssetDirectories)) {
    logger.debug(`Creating ${dir}`);
    await mkdirAsync(dir, { recursive: true });
  }
}
