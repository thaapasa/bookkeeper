import * as React from 'react';
import * as B from 'baconjs';
import { Action } from '../../../shared/types/Common';

// Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

// InferableComponentEnhancerWithProps taken from react-redux 5.0.8
export interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
  <P extends TInjectedProps>(
      component: React.ComponentType<P>
  ): React.ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps>
}

export function connect<
  TBaconProps, 
  TNeedsProps
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
            Object.assign({}, this.props, this.state) as any,
            this.props.children) :
          null;
      }
    };
  };
}
