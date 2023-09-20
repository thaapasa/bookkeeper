export function imageUrlForWidth(imageUrl: string | undefined, width: number) {
  // Use double resolution for retina devices
  return isOwnImage(imageUrl) || !imageUrl ? imageUrl : `${imageUrl}&s=${width * 2}`;
}

export function isOwnImage(imageUrl: string | undefined): boolean {
  return !!imageUrl && imageUrl.startsWith('/');
}
