import * as React from 'react';
import * as B from 'baconjs';
import { Action } from 'shared/types/Common';
import { Omit } from 'shared/util/Objects';
import { unsubscribeAll } from 'client/util/ClientUtil';

// InferableComponentEnhancerWithProps taken from react-redux 5.0.8
type InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> = <
  P extends TInjectedProps
>(
  component: React.ComponentType<P>
) => React.ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps>;

export function connect<TBaconProps, TNeedsProps>(
  source: B.Observable<TBaconProps>
): InferableComponentEnhancerWithProps<TBaconProps, TNeedsProps> {
  return <P extends TBaconProps>(
    component: React.ComponentType<P>
  ): React.ComponentClass<Omit<P, keyof TBaconProps> & TNeedsProps> => {
    return class ConnectedComponent extends React.Component<
      React.PropsWithChildren<Omit<P, keyof TBaconProps> & TNeedsProps>,
      TBaconProps & { hasReceivedProps: boolean }
    > {
      public state: Readonly<TBaconProps & { hasReceivedProps: boolean }> = {
        hasReceivedProps: false,
      } as any;
      private unsub: Action[] = [];
      private mounted = false;

      public componentDidMount() {
        this.mounted = true;
        this.unsub.push(source.onValue(this.setData));
      }

      public componentWillUnmount() {
        this.mounted = false;
        unsubscribeAll(this.unsub);
      }

      private setData = (data: TBaconProps) => {
        if (!this.mounted) {
          return;
        }
        this.setState({ ...(data as any), hasReceivedProps: true });
      };

      public render() {
        return this.state.hasReceivedProps
          ? React.createElement(
              component,
              { ...(this.state as any), ...(this.props as any) } as any,
              this.props.children
            )
          : null;
      }
    };
  };
}
