import * as React from 'react';

import { Size } from '../Types';

/**
 * Keeps track of the given element size in the DOM, updating it if the window
 * size is changed.
 */
export function useWindowSize(): Size {
  const [size, setSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Listen for window resize events
  React.useEffect(() => {
    const listener = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [setSize]);

  return size;
}
