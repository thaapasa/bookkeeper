import * as React from 'react';
import * as B from 'baconjs';
import { Action } from '../../../shared/types/Common';
import { Omit } from '../../../shared/util/Objects';

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
    return class ConnectedComponent extends React.Component<Omit<P, keyof TBaconProps> & TNeedsProps, TBaconProps> {
      public state: TBaconProps;
      private unsubscribe: Action;
      public componentDidMount() {
        this.unsubscribe = source.onValue(data => this.setState(data));
      }
      public componentWillUnmount() {
        this.unsubscribe();
      }
      public render() {
        return this.state ?
          React.createElement(component,
            { ...(this.props as any), ...(this.state as any) } as any,
            this.props.children) :
          null;
      }
    };
  };
}
