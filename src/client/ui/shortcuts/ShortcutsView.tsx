import { IconButton, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/types';
import { spaced } from 'shared/util';
import { validSessionE } from 'client/data/Login';
import { createExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { LinkWithTitle } from './ShortcutLink';

const FullList: React.FC<{
  shortcuts: ExpenseShortcut[];
  className?: string;
}> = ({ className, shortcuts }) => {
  const [editMode, toggleEdit] = useToggle(false);
  return (
    <LinksArea className={spaced`${'with-titles'} ${className}`}>
      <TitledRow>
        <Row className="clickable" onClick={createExpense}>
          <AddExpenseIcon />
          <Title>Uusi kirjaus</Title>
        </Row>
        <Flex minWidth="32px" />
        <IconButton onClick={toggleEdit}>
          <Icons.EditNote />
        </IconButton>
      </TitledRow>
      {shortcuts.map((l, i) => (
        <LinkWithTitle key={`titlelink-${i}`} {...l} />
      ))}
      {editMode ? (
        <TitledRow>
          <Row className="clickable" onClick={createExpense}>
            <AddExpenseIcon />
            <Title>Lisää linkki</Title>
          </Row>
        </TitledRow>
      ) : null}
    </LinksArea>
  );
};

export const ShortcutsView = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] })),
)(FullList);

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

const LinksArea = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;
