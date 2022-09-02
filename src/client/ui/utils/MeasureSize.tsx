import React from 'react';

import { Size, useElementSize } from './useElementSize';

export function MeasureSize<T>(
  component: React.ComponentType<T & { size: Size }>
) {
  return function MeasuredComponent(props: Omit<T, 'size'>) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const size = useElementSize(containerRef);

    const Component = component as any;

    return (
      <div ref={containerRef}>
        {size ? <Component size={size} {...props} /> : null}
      </div>
    );
  };
}
