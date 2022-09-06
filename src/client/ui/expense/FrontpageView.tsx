import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { windowSizeP } from 'client/data/State';

import { connect } from '../component/BaconConnect';
import { ShortcutsView } from '../general/ShortcutsView';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import RoutedMonthView from './RoutedMonthView';

const FrontpageViewImpl: React.FC<
  RouteComponentProps & { size: Size }
> = props =>
  isMobileSize(props.size) ? <ShortcutsView /> : <RoutedMonthView {...props} />;

export const FrontpageView = connect(windowSizeP.map(size => ({ size })))(
  FrontpageViewImpl
);
