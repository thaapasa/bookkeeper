import { AppShell, Box, Container, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { Session } from 'shared/types';
import {
  useExpenseDialogRequestStore,
  useExpenseSplitRequestStore,
} from 'client/data/ExpenseDialogStore';

import { IsFetchingBar } from '../component/IsFetchingBar';
import { MenuDrawer } from '../component/MenuDrawer';
import { ModalDialogConnector } from '../dialog/ModalDialogConnector';
import { ExpenseDialog } from '../expense/dialog/ExpenseDialog';
import { createExpenseDialogListener } from '../expense/dialog/ExpenseDialogListener';
import { ExpenseSplitDialog } from '../expense/split/ExpenseSplitDialog';
import { useIsMobile } from '../hooks/useBreakpoints';
import { AppRouter } from './AppRouter';
import classes from './BookkeeperPage.module.css';
import { mainContentMaxWidth } from './Styles';
import { appLinks, TopBar } from './TopBar';

interface PageProps {
  session: Session;
}

const ExpenseDialogBinder = createExpenseDialogListener(
  ExpenseDialog,
  useExpenseDialogRequestStore,
);

const ExpenseSplitBinder = createExpenseDialogListener(
  ExpenseSplitDialog,
  useExpenseSplitRequestStore,
);

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
          <AppShell.Header bg="transparent" className={classes.header}>
            <TopBar menuOpen={menuOpen} onToggleMenu={toggleMenu} />
          </AppShell.Header>

          <AppShell.Main
            h="100dvh"
            display="flex"
            style={{ flexDirection: 'column', overflow: 'hidden' }}
          >
            <IsFetchingBar />
            <Container size={mainContentMaxWidth} w="100%" p={0} className={classes.cardWrap}>
              <Box className={classes.surface}>
                <ScrollArea flex={1} type="scroll" offsetScrollbars={false}>
                  <AppRouter />
                </ScrollArea>
              </Box>
            </Container>
          </AppShell.Main>
        </AppShell>
        <MenuDrawer
          open={menuOpen}
          onRequestChange={open => (open ? undefined : closeMenu())}
          links={appLinks}
        />
      </Router>
    </>
  );
};
