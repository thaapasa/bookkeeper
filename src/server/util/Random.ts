import { randomBytes } from 'crypto';

// 64 characters used for random string generation
const allowedChars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789-_=!*';

export function getRandomString(len: number): string {
  const bytes = randomBytes(len);
  let result = '';
  bytes.forEach(b => (result += allowedChars[b & 0x3f]));
  return result;
}

// 64 characters used for random file name generation
const allowedFileChars = 'aabcdefghijklmnopqrstuvwxyzAABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function getRandomFilename(len: number): string {
  const bytes = randomBytes(len);
  let result = '';
  bytes.forEach(b => (result += allowedFileChars[b & 0x3f]));
  return result;
}
