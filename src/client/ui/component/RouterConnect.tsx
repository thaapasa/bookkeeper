import * as B from 'baconjs';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export function connectRouter<TRouteProps>(bus: B.Bus<TRouteProps>) {
  return (
    payload: React.ComponentType
  ): React.ComponentClass<RouteComponentProps<TRouteProps>> => {
    return class RouteComponent extends React.Component<
      RouteComponentProps<TRouteProps>
    > {
      public componentDidMount() {
        bus.push(this.props.match.params);
      }
      public componentDidUpdate() {
        bus.push(this.props.match.params);
      }
      public render() {
        return React.createElement(payload);
      }
    };
  };
}
