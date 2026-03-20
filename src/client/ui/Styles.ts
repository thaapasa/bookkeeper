import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Group } from '@mantine/core';

import { neutral } from './Colors';
import { Size } from './Types';

// See responsive UI specs at https://material.io/guidelines/layout/responsive-ui.html
export type ScreenSizeClassName = 'mobile-portrait' | 'mobile-landscape' | 'web' | 'large';

export const mobilePortraitMaxWidth = 600;
export const mobileLandscapeMaxWidth = 840;
export const largeDeviceMinWidth = 1400;

export const mainContentMargin = 32;
export const mainContentMaxWidth = largeDeviceMinWidth - 2 * mainContentMargin;

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
  if (w < mobilePortraitMaxWidth) {
    return 'mobile-portrait';
  }
  if (w < mobileLandscapeMaxWidth) {
    return 'mobile-landscape';
  }
  if (w < largeDeviceMinWidth) {
    return 'web';
  }
  return 'large';
}

export function isScreenAtLeast(windowSize: Size, screenClass: ScreenSizeClassName) {
  switch (screenClass) {
    case 'mobile-portrait':
      return true;
    case 'mobile-landscape':
      return windowSize.width >= mobilePortraitMaxWidth;
    case 'web':
      return windowSize.width >= mobileLandscapeMaxWidth;
    case 'large':
      return windowSize.width >= largeDeviceMinWidth;
  }
}

export function isSizeClassAtLeast(
  windowSize: ScreenSizeClassName,
  screenClass: ScreenSizeClassName,
) {
  switch (screenClass) {
    case 'mobile-portrait':
      return windowSize === 'mobile-portrait';
    case 'mobile-landscape':
      return windowSize === 'mobile-portrait' || windowSize === 'mobile-landscape';
    case 'web':
      return windowSize === 'web' || windowSize === 'large';
    case 'large':
      return windowSize === 'large';
  }
}

const mpmw = mobilePortraitMaxWidth;
const mlmw = mobileLandscapeMaxWidth;

export const media = {
  mobilePortrait: (s: TemplateStringsArray, ...i: any[]) => css`
    @media screen and (max-width: ${mpmw - 1}px) {
      ${css(s, ...i)}
    }
  `,
  mobileLandscape: (s: TemplateStringsArray, ...i: any[]) => css`
    @media screen and (min-width: ${mpmw}px) and (max-width: ${mlmw - 1}px) {
      ${css(s, ...i)}
    }
  `,
  mobile: (s: TemplateStringsArray, ...i: any[]) => css`
    @media screen and (max-width: ${mlmw - 1}px) {
      ${css(s, ...i)}
    }
  `,
  web: (s: TemplateStringsArray, ...i: any[]) => css`
    @media screen and (min-width: ${mpmw}px) {
      ${css(s, ...i)}
    }
  `,
  largeDevice: (s: TemplateStringsArray, ...i: any[]) => css`
    @media screen and (min-width: ${largeDeviceMinWidth}px) {
      ${css(s, ...i)}
    }
  `,
};

/** @deprecated Use Mantine Group directly */
export const VCenterRow = Group;

export const Flex = styled.div`
  flex: 1;
  ${({ minWidth }: { minWidth?: string }) => (minWidth ? `min-width: ${minWidth};` : '')}
`;

export const Pre = styled.div`
  font-family: monospace;
  white-space: pre;
`;

export const PageContentContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: ${neutral[1]};
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;

  &.padded {
    padding: 24px;
  }

  &.center {
    align-items: center;
  }
`;
