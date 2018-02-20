import * as React from 'react';
import { ToolbarGroup } from 'material-ui/Toolbar';
import { Toolbar } from 'material-ui';

export default class NavigationBar extends React.Component<{}, {}> {

  public render() {
    return (
      <Toolbar>
        <ToolbarGroup>
          KULUT
        </ToolbarGroup>
      </Toolbar>
    );
  }

}
