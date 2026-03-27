import * as React from 'react';

import { ShortcutsPage } from '../general/ShortcutsPage';
import { useIsMobile } from '../hooks/useBreakpoints';
import { RoutedMonthView } from './RoutedMonthView';

export const FrontpageView: React.FC = () =>
  useIsMobile() ? <ShortcutsPage /> : <RoutedMonthView />;
