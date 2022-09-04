import * as B from 'baconjs';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export function connectRouter<
  RouteProps extends { [K in keyof RouteProps]?: string }
>(bus: B.Bus<RouteProps>) {
  return (
    payload: React.ComponentType
  ): React.ComponentClass<RouteComponentProps<RouteProps>> => {
    return class RouteComponent extends React.Component<
      RouteComponentProps<RouteProps>
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
