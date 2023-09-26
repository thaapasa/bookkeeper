import * as React from 'react';

import { windowSizeP } from 'client/data/State';

import { connect } from '../component/BaconConnect';
import { ShortcutsPage } from '../general/ShortcutsPage';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import { RoutedMonthView } from './RoutedMonthView';

const FrontpageViewImpl: React.FC<{ size: Size }> = props =>
  isMobileSize(props.size) ? <ShortcutsPage /> : <RoutedMonthView />;

export const FrontpageView = connect(windowSizeP.map(size => ({ size })))(FrontpageViewImpl);
