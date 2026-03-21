import { ActionIcon, Group, Text } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { toDateRangeName, toDateTime } from 'shared/time';
import { navigationP } from 'client/data/State';
import { NavigationConfig } from 'client/data/StateTypes';
import { logger } from 'client/Logger';
import { KeyCodes } from 'client/util/Io';
import { monthSuffix, yearSuffix } from 'client/util/Links';

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
    <Group gap={0} align="center" wrap="nowrap" onKeyUp={handleKeyPress} tabIndex={0}>
      <ActionIcon
        variant="subtle"
        onClick={() => navigateOffset(-1)}
        title="Edellinen"
        size="md"
        radius="xl"
      >
        <Icons.ChevronLeft color="primary" />
      </ActionIcon>
      <Text size="md" w={140} ta="center">
        {toDateRangeName(dateRange)}
      </Text>
      <ActionIcon
        variant="subtle"
        onClick={() => navigateOffset(1)}
        title="Seuraava"
        size="md"
        radius="xl"
      >
        <Icons.ChevronRight color="primary" />
      </ActionIcon>
    </Group>
  );
};

export const DateRangeNavigator = connect(navigationP)(DateRangeNavigatorImpl);
