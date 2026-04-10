import { ActionIcon, Group, Text } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { toDateRangeName, toDateTime } from 'shared/time';
import { useNavigationStore } from 'client/data/NavigationStore';
import { logger } from 'client/Logger';
import { monthSuffix, yearSuffix } from 'client/util/Links';

import { Icons } from '../icons/Icons';

export const DateRangeNavigator: React.FC = () => {
  const dateRange = useNavigationStore(s => s.dateRange);
  const pathPrefix = useNavigationStore(s => s.pathPrefix);
  const navigate = useNavigate();

  const navigateOffset = (offset: number) => {
    const start = toDateTime(dateRange.start);
    const rangeSuffix =
      dateRange.type === 'month'
        ? monthSuffix(start.plus({ months: offset }))
        : yearSuffix(start.plus({ years: offset }));
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
