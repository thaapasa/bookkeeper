import { ActionIcon, Group, Text } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { toDateRangeName, toDateTime } from 'shared/time';
import { navigationP } from 'client/data/State';
import { logger } from 'client/Logger';
import { monthSuffix, yearSuffix } from 'client/util/Links';

import { useBaconProperty } from '../hooks/useBaconState';
import { Icons } from '../icons/Icons';

export const DateRangeNavigator: React.FC = () => {
  const { dateRange, pathPrefix } = useBaconProperty(navigationP);
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

  return (
    <Group gap={0} align="center" wrap="nowrap" tabIndex={0}>
      <ActionIcon onClick={() => navigateOffset(-1)} title="Edellinen" size="md" radius="xl">
        <Icons.ChevronLeft color="primary" />
      </ActionIcon>
      <Text size="md" w={140} ta="center">
        {toDateRangeName(dateRange)}
      </Text>
      <ActionIcon onClick={() => navigateOffset(1)} title="Seuraava" size="md" radius="xl">
        <Icons.ChevronRight color="primary" />
      </ActionIcon>
    </Group>
  );
};
