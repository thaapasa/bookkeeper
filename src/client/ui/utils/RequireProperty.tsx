import React from 'react';

import { isDefined } from 'shared/types';

export function RequireProperty<T, K extends keyof T>(
  propName: K,
  component: React.ComponentType<T>,
) {
  const AllowNullProperty: React.FC<Omit<T, K> & { [k in K]?: T[K] | null }> = props => {
    if (!isDefined(props[propName])) {
      return null;
    }
    const Component = component as any;
    return <Component {...props} />;
  };
  return AllowNullProperty;
}
