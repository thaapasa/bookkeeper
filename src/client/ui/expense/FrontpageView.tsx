import * as React from 'react';
import { Size } from '../Types';
import { isMobileSize } from '../Styles';
import ShortcutsView from '../general/ShortcutsView';
import { RouteComponentProps } from 'react-router';
import RoutedMonthView from './RoutedMonthView';
import { connect } from '../component/BaconConnect';
import { windowSizeP } from 'client/data/State';

const FrontpageView: React.FC<RouteComponentProps & { size: Size }> = props =>
  isMobileSize(props.size) ? <ShortcutsView /> : <RoutedMonthView {...props} />;

export default connect(windowSizeP.map(size => ({ size })))(FrontpageView);
