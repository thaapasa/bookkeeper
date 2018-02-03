import * as React from 'react';
import * as B from 'baconjs';
import { Action } from '../../../shared/types/Common';

// Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
/*
type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
  <P extends TInjectedProps>(
      component: React.Component<P>
  ): React.ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps> & {WrappedComponent: React.Component<P>}
}
*/

export function connect<BaconSource>(source: B.Observable<any, BaconSource>) {
  return (componentType: React.ComponentClass<{ data: BaconSource }>) => {
    return class ConnectedComponent extends React.Component<{}, { data: BaconSource | null }> {
      public state: { data: BaconSource | null } = { data: null };
      private unsubscribe: Action;
      public componentDidMount() {
        this.unsubscribe = source.onValue(data => this.setState({ data }));
      }
      public componentWillUnmount() {
        this.unsubscribe();
      }
      public render() {
        return this.state.data ? React.createElement(componentType, { data: this.state.data }, this.props.children) : null;
      }
    };
  };
}
