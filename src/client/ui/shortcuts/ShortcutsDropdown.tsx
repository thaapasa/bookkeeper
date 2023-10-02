import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/expense';
import { validSessionE } from 'client/data/Login';

import { navigationBar } from '../Colors';
import { connect } from '../component/BaconConnect';
import { AddExpenseNavButton } from '../icons/AddExpenseIcon';
import { ShortcutLink } from './ShortcutLink';

const DropdownImpl: React.FC<{
  shortcuts: ExpenseShortcut[];
  className?: string;
}> = ({ shortcuts, className }) => {
  const height = 40 + (32 + 12) * shortcuts.length;

  return (
    <LinksContainer
      maxHeight={`${height}px`}
      className={shortcuts.length > 0 ? 'enabled' : 'disabled'}
    >
      <LinksArea className={className}>
        <AddExpenseNavButton />
        {shortcuts.map(l => (
          <ShortcutLink key={`link-${l.id}`} {...l} />
        ))}
      </LinksArea>
    </LinksContainer>
  );
};

export const ShortcutsDropdown = connect(
  validSessionE.map(s => ({ shortcuts: s.shortcuts || [] })),
)(DropdownImpl);

const LinksContainer = styled('div')(
  (props: { maxHeight: string }) => `
  position: absolute;
  z-index: 1;
  top: 28px;
  right: 32px;
  padding: 0 4px 4px 4px;
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
