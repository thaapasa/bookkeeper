import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { toDateRangeName, toDateTime } from 'shared/time';
import { navigationP } from 'client/data/State';
import { NavigationConfig } from 'client/data/StateTypes';
import { logger } from 'client/Logger';
import { KeyCodes } from 'client/util/Io';
import { monthSuffix, yearSuffix } from 'client/util/Links';

import * as colors from '../Colors';
import { Icons } from '../icons/Icons';
import { connect } from './BaconConnect';

export type DateRangeNavigatorProps = NavigationConfig;

const DateRangeNavigatorImpl: React.FC<React.PropsWithChildren<DateRangeNavigatorProps>> = ({
  dateRange,
  pathPrefix,
}) => {
  const navigate = useNavigate();
  const navigateOffset = (offset: number) => {
    const rangeSuffix =
      dateRange.type === 'month'
        ? monthSuffix(toDateTime(dateRange.start).plus({ months: offset }))
        : yearSuffix(toDateTime(dateRange.start).plus({ years: offset }));
    const link = pathPrefix + rangeSuffix;
    logger.debug('Navigating to %s', link);
    navigate(link);
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
    <NavigationContainer onKeyUp={handleKeyPress} tabIndex={0}>
      <div>
        <ActionIcon variant="subtle" onClick={() => navigateOffset(-1)} title="Edellinen" size="sm">
          <Icons.ChevronLeft color="primary" />
        </ActionIcon>
      </div>
      <TitleArea>{toDateRangeName(dateRange)}</TitleArea>
      <div>
        <ActionIcon variant="subtle" onClick={() => navigateOffset(1)} title="Seuraava" size="sm">
          <Icons.ChevronRight color="primary" />
        </ActionIcon>
      </div>
    </NavigationContainer>
  );
};

const NavigationContainer = styled.div`
  height: 48px !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const TitleArea = styled.div`
  text-align: center;
  width: 140px;
  color: ${colors.colorScheme.primary.text};
`;

export const DateRangeNavigator = connect(navigationP)(DateRangeNavigatorImpl);
