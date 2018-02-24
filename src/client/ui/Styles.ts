import { Size } from './Types';

// See responsive UI specs at https://material.io/guidelines/layout/responsive-ui.html
export const smallDeviceMaxWidth = 600;
export const largeDeviceMinWidth = 1400;

export function isSmallDevice(windowSize: Size) {
  return windowSize.width < smallDeviceMaxWidth;
}

export function isLargeDevice(windowSize: Size) {
  return windowSize.width > largeDeviceMinWidth;
}

export type ScreenSizeClassName = 'small' | 'medium' | 'large';

export function getScreenSizeClassName(windowSize: Size): ScreenSizeClassName {
  if (isSmallDevice(windowSize)) { return 'small'; }
  if (isLargeDevice(windowSize)) { return 'large'; }
  return 'medium';
}
