import { Group, Text } from '@mantine/core';
import * as React from 'react';

import { MaybePromise } from 'shared/util';

import { ActionButton } from '../component/ActionButton';

export const ToolButton: React.FC<{
  title: string;
  action: () => MaybePromise<unknown>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <Group>
      <Text>{title}</Text>
    </Group>
    <ActionButton onClick={action} variant="contained" color="primary">
      {buttonText}
    </ActionButton>
  </>
);
