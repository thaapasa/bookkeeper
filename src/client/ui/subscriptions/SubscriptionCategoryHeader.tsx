import { IconButton } from '@mui/material';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { Icons } from '../icons/Icons';
import { Label, RowElement, Sum, Tools } from './layout';
import { RecurrenceTotals } from './types';

export type ToggleCategoryVisibility = (categoryId: ObjectId) => void;

export const SubscriptionCategoryHeader: React.FC<{
  title: string;
  totals?: RecurrenceTotals;
  className?: string;
  visible?: boolean;
  categoryId?: ObjectId;
  toggleVisibility?: ToggleCategoryVisibility;
}> = ({ title, totals, className, visible = true, toggleVisibility, categoryId }) => (
  <RowElement className={className}>
    <Label>
      {categoryId && toggleVisibility ? (
        <IconButton onClick={() => toggleVisibility(categoryId)}>
          {visible ? <Icons.Visible /> : <Icons.Hidden />}
        </IconButton>
      ) : null}
      {title}
    </Label>
    {totals ? (
      <>
        <Sum className="optional">{Money.from(totals.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(totals.recurrencePerYear).format()} / v</Sum>
        <Tools />
      </>
    ) : null}
  </RowElement>
);
