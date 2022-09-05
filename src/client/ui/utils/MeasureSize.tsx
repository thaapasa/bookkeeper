import React from 'react';

import { useDebounced } from './useDebounced';
import { Size, useElementSize } from './useElementSize';

export function MeasureSize<T>(
  component: React.ComponentType<T & { size: Size }>
) {
  const MeasuredComponent: React.FC<
    Omit<T, 'size'> & { className?: string }
  > = ({ className, ...props }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const size = useElementSize(containerRef);

    const debouncedSize = useDebounced(size);

    const Component = component as any;
    return (
      <div ref={containerRef} className={className}>
        {size ? <Component size={debouncedSize ?? size} {...props} /> : null}
      </div>
    );
  };
  return MeasuredComponent;
}
