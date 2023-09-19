import { Grid } from '@mui/material';
import React from 'react';

import { Session } from 'shared/types';
import { noop } from 'shared/util';

import { TextEdit } from '../component/TextEdit';
import { Subtitle } from '../design/Text';
import { ProfileItem } from './ProfileItem';

export const PasswordChangeView: React.FC<{ session: Session }> = ({}) => {
  return (
    <>
      <Grid item xs={12}>
        <Subtitle>Vaihda salasana</Subtitle>
      </Grid>
      <ProfileItem title="Nykyinen salasana">
        <TextEdit
          onChange={noop}
          value={''}
          type="password"
          name="current-password"
          autoCapitalize="off"
          autoCorrect="current-password"
          width="280px"
        />
      </ProfileItem>
      <ProfileItem title="Uusi salasana">
        <TextEdit
          onChange={noop}
          value={''}
          type="password"
          name="new-password"
          autoCapitalize="off"
          autoCorrect="new-password"
          width="280px"
        />
      </ProfileItem>
      <ProfileItem title="Toista salasana">
        <TextEdit
          onChange={noop}
          value={''}
          type="password"
          name="new-password"
          autoCapitalize="off"
          autoCorrect="repeat-password"
          width="280px"
        />
      </ProfileItem>
    </>
  );
};
