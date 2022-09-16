import { Request, Response } from 'express';

import { toMoment } from 'shared/time';
import { TokenNotPresentError } from 'shared/types';

const httpDateHeaderPattern = 'ddd, DD MMM YYYY HH:mm:ss';
function setNoCacheHeaders(res: Response): Response {
  res.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate, max-age=0'
  );
  res.set('Pragma', 'no-cache');
  const time = toMoment().utc().format(httpDateHeaderPattern) + ' GMT';
  res.set('Date', time);
  res.set('Expires', time);
  return res;
}

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
export function getToken(req: Request): string {
  const tmatch = bearerMatch.exec(req.header('Authorization') || '');
  const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
  if (!token) {
    throw new TokenNotPresentError();
  }
  return token;
}

export const ServerUtil = {
  setNoCacheHeaders,
  getToken,
};
