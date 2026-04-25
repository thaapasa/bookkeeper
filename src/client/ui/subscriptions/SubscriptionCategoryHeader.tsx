import { ActionIcon, Box, type BoxProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { Icons } from '../icons/Icons';
import { SubscriptionRow, Sum, Tools } from './SubscriptionLayout';
import { RecurrenceTotals } from './types';

const HeaderLabel: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box flex={1} {...props} />
);

export type ToggleCategoryVisibility = (categoryId: ObjectId) => void;

export const SubscriptionCategoryHeader: React.FC<{
  title: string;
  totals?: RecurrenceTotals;
  isRoot?: boolean;
  visible?: boolean;
  categoryId?: ObjectId;
  toggleVisibility?: ToggleCategoryVisibility;
}> = ({ title, totals, isRoot, visible = true, toggleVisibility, categoryId }) => (
  <SubscriptionRow
    bg={isRoot ? 'surface.4' : 'surface.2'}
    fw={isRoot ? 700 : undefined}
    c={isRoot ? undefined : 'primary.7'}
  >
    <HeaderLabel>
      {categoryId && toggleVisibility ? (
        <ActionIcon onClick={() => toggleVisibility(categoryId)}>
          {visible ? <Icons.Visible /> : <Icons.Hidden />}
        </ActionIcon>
      ) : null}
      {title}
    </HeaderLabel>
    {totals ? (
      <>
        <Sum visibleFrom="sm">{Money.from(totals.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(totals.recurrencePerYear).format()} / v</Sum>
        <Tools />
      </>
    ) : null}
  </SubscriptionRow>
);
