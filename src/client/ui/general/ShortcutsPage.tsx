import { Box } from '@mantine/core';
import * as React from 'react';

import { NewExpenseDialogRoutes } from '../expense/dialog/NewExpenseDialogPage';
import { PageLayout } from '../layout/PageLayout';
import { ShortcutsView } from '../shortcuts/ShortcutsView';

export const ShortcutsPage: React.FC = () => (
  <>
    <PageLayout>
      <Box p="md" maw={600} mx="auto">
        <ShortcutsView />
      </Box>
    </PageLayout>
    <NewExpenseDialogRoutes />
  </>
);
