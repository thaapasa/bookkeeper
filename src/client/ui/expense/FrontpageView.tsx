import * as React from 'react';
import { Size } from '../Types';
import { isMobileSize } from '../Styles';
import ShortcutsView from '../general/ShortcutsView';
import { RouteComponentProps } from 'react-router';
import RoutedMonthView from './RoutedMonthView';
import { connect } from '../component/BaconConnect';
import { windowSizeP } from 'client/data/State';

class FrontpageView extends React.Component<
  RouteComponentProps & { size: Size }
> {
  public render() {
    if (isMobileSize(this.props.size)) {
      return <ShortcutsView />;
    } else {
      return <RoutedMonthView {...this.props} />;
    }
  }
}

export default connect(windowSizeP.map(size => ({ size })))(FrontpageView);
