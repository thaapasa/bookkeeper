import { Size } from './Types';
import { css, SimpleInterpolation } from 'styled-components';

// See responsive UI specs at https://material.io/guidelines/layout/responsive-ui.html
export type ScreenSizeClassName = 'mobile-portrait' | 'mobile-landscape' | 'web' | 'large';

export const mobilePortraitMaxWidth = 600;
export const mobileLandscapeMaxWidth = 840;
export const largeDeviceMinWidth = 1400;

export function isMobilePortraitSize(windowSize: Size) {
  return windowSize.width < mobilePortraitMaxWidth;
}

export function isMobileLandscapeSize(windowSize: Size) {
  return windowSize.width >= mobilePortraitMaxWidth && windowSize.width < mobileLandscapeMaxWidth;
}

export function isMobileSize(windowSize: Size) {
  return windowSize.width < mobileLandscapeMaxWidth;
}

export function isWebSize(windowSize: Size) {
  return windowSize.width >= mobileLandscapeMaxWidth && windowSize.width < largeDeviceMinWidth;
}

export function isLargeSize(windowSize: Size) {
  return windowSize.width >= largeDeviceMinWidth;
}

export function getScreenSizeClassName(windowSize: Size): ScreenSizeClassName {
  const w = windowSize.width;
  if (w < mobilePortraitMaxWidth) { return 'mobile-portrait'; }
  if (w < mobileLandscapeMaxWidth) { return 'mobile-landscape'; }
  if (w < largeDeviceMinWidth) { return 'web'; }
  return 'large';
}

export function isScreenAtLeast(windowSize: Size, screenClass: ScreenSizeClassName) {
  switch (screenClass) {
    case 'mobile-portrait': return true;
    case 'mobile-landscape': return windowSize.width >= mobilePortraitMaxWidth;
    case 'web': return windowSize.width >= mobileLandscapeMaxWidth;
    case 'large': return windowSize.width >= largeDeviceMinWidth;
  }
}

export function isSizeClassAtLeast(windowSize: ScreenSizeClassName, screenClass: ScreenSizeClassName) {
  switch (screenClass) {
    case 'mobile-portrait': return windowSize === 'mobile-portrait';
    case 'mobile-landscape': return windowSize === 'mobile-portrait' || windowSize === 'mobile-landscape';
    case 'web': return windowSize === 'web' || windowSize === 'large';
    case 'large': return windowSize === 'large';
  }
}

export const media = {
  mobilePortrait: (s: TemplateStringsArray, ...i: SimpleInterpolation[]) => css`
    @media screen and (max-width: ${mobilePortraitMaxWidth - 1}px) {
      ${ css(s, ...i) }
    }
  `,
  mobileLandscape: (s: TemplateStringsArray, ...i: SimpleInterpolation[]) => css`
    @media screen and (min-width: ${mobilePortraitMaxWidth}px) and (max-width: ${mobileLandscapeMaxWidth - 1}px) {
      ${ css(s, ...i) }
    }
  `,
  mobile: (s: TemplateStringsArray, ...i: SimpleInterpolation[]) => css`
    @media screen and (max-width: ${mobileLandscapeMaxWidth - 1}px) {
      ${ css(s, ...i) }
    }
  `,
  web: (s: TemplateStringsArray, ...i: SimpleInterpolation[]) => css`
    @media screen and (min-width: ${mobilePortraitMaxWidth}px) and (max-width: ${mobileLandscapeMaxWidth - 1}px) {
      ${ css(s, ...i) }
    }
  `,
  largeDevice: (s: TemplateStringsArray, ...i: SimpleInterpolation[]) => css`
    @media screen and (min-width: ${largeDeviceMinWidth}px) {
      ${ css(s, ...i) }
    }
  `,
};
