import { useMediaQuery } from '@mantine/hooks';

/**
 * Responsive breakpoint hooks using Mantine's default breakpoints.
 *
 * Breakpoints (from mantineTheme.ts):
 *   xs: 36em (576px) — small phones
 *   sm: 48em (768px) — mobile/desktop boundary
 *   md: 62em (992px) — tablet landscape
 *   lg: 75em (1200px) — desktop
 *   xl: 88em (1408px) — large desktop
 */

/** True when viewport is below the `sm` breakpoint (< 768px) */
export function useIsMobile() {
  return !useMediaQuery('(min-width: 48em)');
}

/** True when viewport is below the `xs` breakpoint (< 576px) */
export function useIsMobilePortrait() {
  return !useMediaQuery('(min-width: 36em)');
}

/** True when viewport is below the `md` breakpoint (< 992px) */
export function useIsTablet() {
  return !useMediaQuery('(min-width: 62em)');
}
