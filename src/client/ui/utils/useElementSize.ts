import * as React from 'react';

export interface Size {
  width: number;
  height: number;
}

/**
 * Keeps track of the given element size in the DOM, updating it if the window
 * size is changed.
 */
export function useElementSize(ref: React.RefObject<HTMLElement>): Size | null {
  const [size, setSize] = React.useState<Size | null>(
    ref.current?.getBoundingClientRect() ?? null
  );

  // TODO: See if this pattern could be used instead of the effect below
  // Updating size during rendering is a valid pattern:
  // https://beta-reactjs-org-git-you-might-not-fbopensource.vercel.app/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // if (ref.current && !size) setSize(ref.current.getBoundingClientRect());

  // Check the size after first render with an effect
  React.useEffect(() => {
    if (ref.current) {
      const realSize = ref.current.getBoundingClientRect();
      if (
        !size ||
        realSize.width !== size.width ||
        realSize.height !== size.height
      ) {
        setSize(realSize);
      }
    }
  }, [ref, size]);

  // Update size when window is resized
  React.useEffect(() => {
    const listener = () => {
      if (ref.current) setSize(ref.current.getBoundingClientRect());
    };
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [setSize, ref]);

  return size;
}
