import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/types';
import { validSessionE } from 'client/data/Login';

import { navigationBar } from '../Colors';
import { connect } from '../component/BaconConnect';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { LinkIcon } from './ShortcutLink';

const DropdownImpl: React.FC<{
  shortcuts: ExpenseShortcut[];
  className?: string;
}> = ({ shortcuts, className }) => {
  const height = 40 + (34 + 12) * shortcuts.length;

  return (
    <LinksContainer
      maxHeight={`${height}px`}
      className={shortcuts.length > 0 ? 'enabled' : 'disabled'}
    >
      <LinksArea className={className}>
        <AddExpenseIcon />
        {shortcuts.map((l, i) => (
          <LinkIcon key={`link-${i}`} {...l} />
        ))}
      </LinksArea>
    </LinksContainer>
  );
};

export const ShortcutsDropdown = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] })),
)(DropdownImpl);

const LinksContainer = styled('div')(
  (props: { maxHeight: string }) => `
  position: absolute;
  z-index: 1;
  top: 28px;
  right: 32px;
  padding: 0 8px 8px 8px;
  border-radius: 22px;

  overflow: hidden;
  transition:
    max-height 0.33s ease-in-out,
    background-color 0.33s ease-in-out;
  max-height: 32px;

  &.enabled:hover {
    max-height: ${props.maxHeight};
    background-color: ${navigationBar};
  }
`,
);

const LinksArea = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;
