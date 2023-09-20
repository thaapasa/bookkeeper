import crypto from 'crypto';

export function determineUserImage(imagePath?: string, email?: string): string | undefined {
  if (imagePath) {
    return imagePath;
  }
  if (email) {
    return getGravatarUrl(email);
  }
  return undefined;
}

export function getGravatarUrl(email: string): string {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=wavatar`;
}
