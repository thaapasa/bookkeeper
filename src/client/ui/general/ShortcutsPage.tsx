import { Box } from '@mantine/core';
import * as React from 'react';

import { NewExpenseDialogRoutes } from '../expense/dialog/NewExpenseDialogPage';
import { ShortcutsView } from '../shortcuts/ShortcutsView';

export const ShortcutsPage: React.FC = () => (
  <>
    <Box p="md" maw={600} mx="auto">
      <ShortcutsView />
    </Box>
    <NewExpenseDialogRoutes />
  </>
);
