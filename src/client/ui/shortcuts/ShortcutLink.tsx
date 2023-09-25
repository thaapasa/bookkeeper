import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/types';
import { createNewExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';

export const LinkIcon: React.FC<ExpenseShortcut & { noClick?: boolean }> = props => (
  <LinkIconArea
    onClick={!props.noClick ? () => createNewExpense(props.values) : undefined}
    style={{ background: props.background }}
  >
    {props.icon ? (
      <LinkImage src={props.icon} title={props.title} />
    ) : (
      props.title.substring(0, 1).toUpperCase()
    )}
  </LinkIconArea>
);

export const LinkWithTitle: React.FC<ExpenseShortcut> = props => (
  <TitledRow onClick={() => createNewExpense(props.values)}>
    <LinkIcon {...props} noClick />
    <Title>{props.title}</Title>
  </TitledRow>
);

const LinkImage = styled('img')`
  width: 32px;
  height: 32px;
  border-radius: 16px;
`;

const TitledRow = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  align-self: stretch;
`;

const Title = styled('div')`
  font-size: 14px;
  margin-left: 8px;
  color: ${secondaryColors.dark};
`;

const LinkIconArea = styled('div')`
  width: 34px;
  height: 34px;
  margin: 0 4px;
  background-color: ${secondaryColors.standard};
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  margin-bottom: 4px;
  text-decoration: none;
  color: ${secondaryColors.text};
  font-weight: bold;
`;
