import * as B from 'baconjs';
import * as React from 'react';

import { Omit } from 'shared/util/Objects';

// InferableComponentEnhancerWithProps taken from react-redux 5.0.8
type InferableComponentEnhancerWithProps<InjectedProps, NeedsProps> = <
  P extends InjectedProps
>(
  component: React.ComponentType<P>
) => React.ComponentType<Omit<P, keyof InjectedProps> & NeedsProps>;

export function connect<BaconProps, NeedsProps>(
  source: B.Observable<BaconProps>
): InferableComponentEnhancerWithProps<BaconProps, NeedsProps> {
  return <P extends BaconProps>(
    component: React.ComponentType<P>
  ): React.ComponentType<Omit<P, keyof BaconProps> & NeedsProps> => {
    const WrappedComponent: React.FC<
      React.PropsWithChildren<Omit<P, keyof BaconProps> & NeedsProps>
    > = ({ children, ...props }) => {
      const [state, setState] = React.useState<
        { data: BaconProps } | undefined
      >();
      React.useEffect(
        () => source.onValue(data => setState({ data })),
        [setState]
      );

      const Component = component as any;
      return state ? (
        <Component {...state.data} {...props}>
          {children}
        </Component>
      ) : null;
    };
    return WrappedComponent;
  };
}
