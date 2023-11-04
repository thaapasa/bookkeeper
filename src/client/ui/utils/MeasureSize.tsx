import styled from '@emotion/styled';
import React from 'react';

import { useDebounced } from '../hooks/useDebounced';
import { useElementSize } from '../hooks/useElementSize';
import { Size } from '../Types';

export function MeasureSize<T>(
  component: React.ComponentType<T & { size: Size }>,
  height?: number | string,
) {
  const MeasuredComponent: React.FC<Omit<T, 'size'> & { className?: string }> = ({
    className,
    ...props
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const size = useElementSize(containerRef);
    const debounced = useDebounced(size) ?? size;

    const Component = component as any;
    return React.useMemo(
      () => (
        <MeasureDiv ref={containerRef} className={className} height={height}>
          {size ? <Component size={debounced} {...props} /> : null}
        </MeasureDiv>
      ),
      // eslint-disable-next-line
      [Component, className, debounced, ...(Object.keys(props)), ...(Object.values(props))],
    );
  };
  return MeasuredComponent;
}

const MeasureDiv = styled('div')`
  display: flex;
  flex: 1;
  ${(props: { height?: string | number }) => (props.height ? `height: ${props.height}` : '')}
`;
