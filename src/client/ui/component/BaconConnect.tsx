import * as React from 'react';
import * as B from 'baconjs';
import { Action } from '../../../shared/types/Common';
import { Omit } from '../../../shared/util/Objects';
import { unsubscribeAll } from '../../util/ClientUtil';

// InferableComponentEnhancerWithProps taken from react-redux 5.0.8
type InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> =
  <P extends TInjectedProps>(component: React.ComponentType<P>) =>
    React.ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps>;

export function connect<
  TBaconProps,
  TNeedsProps,
>(source: B.Observable<any, TBaconProps>): InferableComponentEnhancerWithProps<TBaconProps, TNeedsProps> {
  return <P extends TBaconProps>(component: React.ComponentType<P>):
    React.ComponentClass<Omit<P, keyof TBaconProps> & TNeedsProps> => {
    return class ConnectedComponent extends React.Component<Omit<P, keyof TBaconProps> & TNeedsProps, TBaconProps & { hasReceivedProps: boolean }> {
      public state: Readonly<TBaconProps & { hasReceivedProps: boolean }> = { hasReceivedProps: false } as any;
      private unsub: Action[] = [];
      public componentDidMount() {
        this.unsub.push(source.onValue(data => this.setState({ ...(data as any), hasReceivedProps: true })));
      }
      public componentWillUnmount() {
        unsubscribeAll(this.unsub);
      }
      public render() {
        return this.state.hasReceivedProps ?
          React.createElement(component,
            { ...(this.props as any), ...(this.state as any) } as any,
            this.props.children) :
          null;
      }
    };
  };
}
