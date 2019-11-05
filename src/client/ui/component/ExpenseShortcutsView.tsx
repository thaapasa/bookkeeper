import * as React from 'react';
import styled from 'styled-components';

import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { secondaryColors, navigationBar } from '../Colors';
import { ExpenseInEditor } from '../../../shared/types/Expense';
import { expenseDialogE } from '../../../client/data/State';
import { ExpenseShortcut } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { validSessionE } from '../../../client/data/Login';

class ExpenseShortcutsViewImpl extends React.Component<{
  shortcuts: ExpenseShortcut[];
}> {
  get height() {
    return 40 + (34 + 12) * this.props.shortcuts.length;
  }

  render() {
    return (
      <LinksContainer
        theme={{ maxHeight: `${this.height}px` }}
        className={this.props.shortcuts.length > 0 ? 'enabled' : 'disabled'}
      >
        <LinksArea>
          <AddExpenseIcon />
          {this.props.shortcuts.map((l, i) => (
            <LinkIcon key={i} {...l} />
          ))}
        </LinksArea>
      </LinksContainer>
    );
  }
}

export const ExpenseShortcutsView = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] }))
)(ExpenseShortcutsViewImpl);

function addExpense(values: Partial<ExpenseInEditor>) {
  expenseDialogE.push({ expenseId: null, resolve: () => {}, values });
}

const LinkIcon = (props: ExpenseShortcut) => (
  <LinkIconArea onClick={() => addExpense(props.values)}>
    {props.icon ? (
      <LinkImage src={props.icon} title={props.title} />
    ) : (
      props.title.substring(0, 1).toUpperCase()
    )}
  </LinkIconArea>
);

const LinkImage = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 16px;
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
`;

const LinkIconArea = styled.div`
  width: 34px;
  height: 34px;
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
