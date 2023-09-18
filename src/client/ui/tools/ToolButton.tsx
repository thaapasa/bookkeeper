import { Grid } from '@mui/material';
import * as React from 'react';

import { MaybePromise } from 'shared/util';

import { ActionButton } from '../component/ActionButton';
import { Text } from '../design/Text';

export const ToolButton: React.FC<{
  title: string;
  action: () => MaybePromise<any>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <Grid item xs={4} alignSelf="center">
      <Text>{title}</Text>
    </Grid>
    <Grid item xs={8} alignSelf="center">
      <ActionButton onClick={action} variant="contained" color="primary">
        {buttonText}
      </ActionButton>
    </Grid>
  </>
);
