import { IconButton, styled } from '@mui/material';
import debug from 'debug';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { toDateRangeName, toMoment } from 'shared/time';
import { navigationP } from 'client/data/State';
import { NavigationConfig } from 'client/data/StateTypes';
import { KeyCodes } from 'client/util/Io';
import { monthSuffix, yearSuffix } from 'client/util/Links';

import * as colors from '../Colors';
import { Icons } from '../icons/Icons';
import { connect } from './BaconConnect';

const log = debug('bookkeeper:navigator');

export type DateRangeNavigatorProps = NavigationConfig & RouteComponentProps;

const DateRangeNavigatorImpl: React.FC<DateRangeNavigatorProps> = ({
  dateRange,
  pathPrefix,
  history,
}) => {
  const navigateOffset = (offset: number) => {
    const rangeSuffix =
      dateRange.type === 'month'
        ? monthSuffix(toMoment(dateRange.start).clone().add(offset, 'months'))
        : yearSuffix(toMoment(dateRange.start).clone().add(offset, 'year'));
    const link = pathPrefix + rangeSuffix;
    log('Navigating to', link);
    history.push(link);
  };

  const handleKeyPress = (event: React.KeyboardEvent<any>) => {
    switch (event.keyCode) {
      case KeyCodes.right:
        navigateOffset(1);
        return false;
      case KeyCodes.left:
        navigateOffset(-1);
        return false;
    }
    return;
  };

  return (
    <NavigationContainer onKeyUp={handleKeyPress} tabIndex={1}>
      <div>
        <StyledIconButton onClick={() => navigateOffset(-1)} title="Edellinen">
          <Icons.ChevronLeft color="primary" />
        </StyledIconButton>
      </div>
      <TitleArea>{toDateRangeName(dateRange)}</TitleArea>
      <div>
        <StyledIconButton onClick={() => navigateOffset(1)} title="Seuraava">
          <Icons.ChevronRight color="primary" />
        </StyledIconButton>
      </div>
    </NavigationContainer>
  );
};

const NavigationContainer = styled('div')`
  height: 48px !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const TitleArea = styled('div')`
  text-align: center;
  width: 140px;
  font-size: 12pt;
  color: ${colors.colorScheme.primary.text};
`;

export const DateRangeNavigator = connect(navigationP)(
  withRouter(DateRangeNavigatorImpl)
);
