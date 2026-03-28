import { AppShell, Container, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { Session } from 'shared/types';
import { expenseDialogE, expenseSplitE } from 'client/data/State.ts';

import MenuDrawer from '../component/MenuDrawer.tsx';
import { NotificationBar } from '../component/NotificationBar.tsx';
import { ModalDialogConnector } from '../dialog/ModalDialogConnector.tsx';
import { ExpenseDialog } from '../expense/dialog/ExpenseDialog.tsx';
import { createExpenseDialogListener } from '../expense/dialog/ExpenseDialogListener.tsx';
import { ExpenseSplitDialog } from '../expense/split/ExpenseSplitDialog.tsx';
import { useIsMobile } from '../hooks/useBreakpoints';
import { AppRouter } from './AppRouter.tsx';
import { mainContentMaxWidth } from './Styles.ts';
import { appLinks, TopBar } from './TopBar.tsx';

interface PageProps {
  session: Session;
}

const ExpenseDialogBinder = createExpenseDialogListener(ExpenseDialog, expenseDialogE);

const ExpenseSplitBinder = createExpenseDialogListener(ExpenseSplitDialog, expenseSplitE);

export const BookkeeperPage: React.FC<PageProps> = () => {
  const isMobile = useIsMobile();
  const [menuOpen, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);

  return (
    <>
      <ExpenseDialogBinder isMobile={isMobile} />
      <ExpenseSplitBinder isMobile={isMobile} />
      <ModalDialogConnector />
      <Router>
        <AppShell header={{ height: 56 }} padding={0} withBorder={false}>
          <AppShell.Header bg="var(--mantine-color-default-hover)">
            <TopBar menuOpen={menuOpen} onToggleMenu={toggleMenu} />
          </AppShell.Header>

          <AppShell.Main
            style={{
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <ScrollArea flex={1} type="scroll" offsetScrollbars={false}>
              <Container size={mainContentMaxWidth} p={0}>
                <AppRouter />
              </Container>
            </ScrollArea>
          </AppShell.Main>
        </AppShell>
        <MenuDrawer
          open={menuOpen}
          onRequestChange={open => (open ? undefined : closeMenu())}
          links={appLinks}
        />
      </Router>
      <NotificationBar />
    </>
  );
};
