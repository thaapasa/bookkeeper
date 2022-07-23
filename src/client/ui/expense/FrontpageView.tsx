import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { windowSizeP } from 'client/data/State';

import { connect } from '../component/BaconConnect';
import ShortcutsView from '../general/ShortcutsView';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import RoutedMonthView from './RoutedMonthView';

const FrontpageView: React.FC<RouteComponentProps & { size: Size }> = props =>
  isMobileSize(props.size) ? <ShortcutsView /> : <RoutedMonthView {...props} />;

export default connect(windowSizeP.map(size => ({ size })))(FrontpageView);
