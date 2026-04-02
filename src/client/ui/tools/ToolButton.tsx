import { Box, Text } from '@mantine/core';
import * as React from 'react';

import { MaybePromise } from 'shared/util';

import { ActionButton } from '../component/ActionButton';

export const ToolButton: React.FC<{
  title: string;
  action: () => MaybePromise<any>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <Box display="flex" style={{ alignItems: 'center' }}>
      <Text>{title}</Text>
    </Box>
    <div>
      <ActionButton onClick={action} variant="contained" color="primary">
        {buttonText}
      </ActionButton>
    </div>
  </>
);
