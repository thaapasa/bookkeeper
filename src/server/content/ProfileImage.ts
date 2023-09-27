import crypto from 'crypto';

import { AssetDirectories } from './Content';
import { ImageManager } from './ImageManager';

const ProfileImageSizeSmall = 128;
const ProfileImageSizeLarge = 512;

export const profileImageHandler = new ImageManager(
  { directory: AssetDirectories.profileImage, webPath: 'content/profile' },
  {
    small: { width: 128, height: 128, scale: 4, description: 'small profile image' },
    large: {
      width: 512,
      height: 512,
      scale: 4,
      suffix: 'large',
      description: 'large profile image',
    },
  },
);

export function profileImagePath(
  imagePath: string | undefined,
  email: string | undefined,
  variant: 'small' | 'large',
): string | undefined {
  if (imagePath) {
    return profileImageHandler.getVariant(variant, imagePath).webPath;
  }
  if (email) {
    const size = variant === 'large' ? ProfileImageSizeLarge : ProfileImageSizeSmall;
    return `${getGravatarUrl(email)}&s=${size}`;
  }
  return undefined;
}

export function getGravatarUrl(email: string): string {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=wavatar`;
}
