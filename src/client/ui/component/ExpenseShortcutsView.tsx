import * as React from 'react';
import styled from 'styled-components';

import { ExpenseShortcut } from 'shared/types/Session';
import { spaced } from 'shared/util';
import { validSessionE } from 'client/data/Login';
import { createExpense, createNewExpense } from 'client/data/State';

import { navigationBar, secondaryColors } from '../Colors';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { connect } from './BaconConnect';

const ExpenseShortcutsListImpl: React.FC<{
  shortcuts: ExpenseShortcut[];
  showTitles?: boolean;
  className?: string;
}> = ({ showTitles, className, shortcuts }) => {
  const titles = showTitles === true;
  return (
    <LinksArea className={spaced`${titles ? 'with-titles' : ''} ${className} `}>
      {titles ? (
        <TitledRow onClick={createExpense}>
          <AddExpenseIcon />
          <Title>Uusi kirjaus</Title>
        </TitledRow>
      ) : (
        <AddExpenseIcon />
      )}
      {shortcuts.map((l, i) =>
        titles ? <LinkWithTitle key={i} {...l} /> : <LinkIcon key={i} {...l} />
      )}
    </LinksArea>
  );
};

const ExpenseShortcutsViewImpl: React.FC<{
  shortcuts: ExpenseShortcut[];
}> = props => {
  const height = 40 + (34 + 12) * props.shortcuts.length;

  return (
    <LinksContainer
      theme={{ maxHeight: `${height}px` }}
      className={props.shortcuts.length > 0 ? 'enabled' : 'disabled'}
    >
      <ExpenseShortcutsListImpl {...props} />
    </LinksContainer>
  );
};

export const ExpenseShortcutsView = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] }))
)(ExpenseShortcutsViewImpl);

export const ExpenseShortcutsList = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] }))
)(ExpenseShortcutsListImpl);

const LinkIcon: React.FC<ExpenseShortcut & { noClick?: boolean }> = props => (
  <LinkIconArea
    onClick={() => !props.noClick && createNewExpense(props.values)}
    style={{ background: props.background }}
  >
    {props.icon ? (
      <LinkImage src={props.icon} title={props.title} />
    ) : (
      props.title.substring(0, 1).toUpperCase()
    )}
  </LinkIconArea>
);

const LinkWithTitle: React.FC<ExpenseShortcut> = props => (
  <TitledRow onClick={() => createNewExpense(props.values)}>
    <LinkIcon {...props} noClick />
    <Title>{props.title}</Title>
  </TitledRow>
);

const LinkImage = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 16px;
`;

const TitledRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;
const Title = styled.div`
  font-size: 14px;
  margin-left: 8px;
  color: ${secondaryColors.dark};
`;

const LinksContainer = styled.div`
  position: absolute;
  z-index: 1;
  top: 28px;
  right: 32px;
  padding: 0 8px 8px 8px;
  border-radius: 22px;

  overflow: hidden;
  transition: max-height 0.33s ease-in-out, background-color 0.33s ease-in-out;
  max-height: 32px;

  &.enabled:hover {
    max-height: ${props => props.theme.maxHeight};
    background-color: ${navigationBar};
  }
`;

const LinksArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;

const LinkIconArea = styled.div`
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
