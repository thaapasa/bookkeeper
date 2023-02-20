import { Grid } from '@mui/material';
import * as React from 'react';

import { MaybePromise } from 'shared/util';

import { ActionButton } from '../component/ActionButton';

export const ToolButton: React.FC<{
  title: string;
  action: () => MaybePromise<any>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <Grid item xs={4}>
      {title}
    </Grid>
    <Grid item xs={8}>
      <ActionButton onClick={action} variant="contained" color="primary">
        {buttonText}
      </ActionButton>
    </Grid>
  </>
);
