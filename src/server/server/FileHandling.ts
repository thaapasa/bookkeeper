import { Request, Response } from 'express';
import { mkdir } from 'fs';
import path from 'path';
import { ITask } from 'pg-promise';
import { promisify } from 'sys';

import { SessionBasicInfo } from 'shared/types';
import { AssetDirectories } from 'server/assets/Assets';
import { config } from 'server/Config';
import { logger } from 'server/Logger';
import { getRandomFilename } from 'server/util/Random';

import { HandlerParams } from './RequestHandling';

const mkdirAsync = promisify(mkdir);

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

/**
 * @param paramName name of the path parameter in which the original file name is passed
 * @param handler the handler that is called once the uploaded file has been written to a temp file
 */
export function processFileUpload<Return, N extends string, P extends { [k in N]: string }, Q>(
  paramName: N,
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
    const res = await storeUploadedFile(req, data.params[paramName]);
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
