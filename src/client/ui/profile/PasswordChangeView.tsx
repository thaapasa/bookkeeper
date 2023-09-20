import { Button, CircularProgress, Grid } from '@mui/material';
import React from 'react';
import { create } from 'zustand';

import { Session } from 'shared/types';
import { isPassword, PasswordUpdate } from 'shared/userData';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/State';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';
import { Subtitle } from '../design/Text';
import { ProfileItem } from './ProfileItem';

export type PasswordState = PasswordUpdate & {
  repeatPassword: string;
  setCurrent: (password: string) => void;
  setNew: (password: string) => void;
  setNewRepeat: (password: string) => void;
  reset: () => void;
  saving: AsyncData<void>;
  setSaving: (savingState: AsyncData<void>) => void;
};

export const usePasswordState = create<PasswordState>(set => ({
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
  reset: () => set({ currentPassword: '', newPassword: '', repeatPassword: '' }),
  saving: UninitializedData,
  setCurrent: currentPassword => set({ currentPassword }),
  setNew: newPassword => set({ newPassword }),
  setNewRepeat: repeatPassword => set({ repeatPassword }),
  setSaving: saving => set({ saving }),
}));

function toPasswordUpdate(state: PasswordState): PasswordUpdate {
  return { currentPassword: state.currentPassword, newPassword: state.newPassword };
}

export const PasswordChangeView: React.FC<{ session: Session }> = ({}) => {
  const state = usePasswordState();

  const newPasswordValid = isPassword(state.newPassword);
  const passwordsMatch = state.newPassword === state.repeatPassword;
  const dataValid = state.currentPassword && newPasswordValid && passwordsMatch;
  const newHasError = !!state.newPassword && !newPasswordValid;
  const repeatHasError = !!state.repeatPassword && !passwordsMatch;
  const changed = state.newPassword || state.currentPassword || state.repeatPassword;

  const isSaving = state.saving.type === 'loading';

  const save = () => {
    if (!dataValid || !changed) {
      logger.debug('Skipping submit, no changes or invalid data');
      return;
    }
    executeOperation(() => changeUserPassword(toPasswordUpdate(state)), {
      postProcess: () => notify('Salasana vaihdettu!'),
      trackProgress: state.setSaving,
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Subtitle>Vaihda salasana</Subtitle>
      </Grid>
      <ProfileItem title="Nykyinen salasana">
        <TextEdit
          onChange={state.setCurrent}
          value={state.currentPassword}
          type="password"
          name="current-password"
          autoCapitalize="off"
          autoCorrect="current-password"
          width="280px"
        />
      </ProfileItem>
      <ProfileItem title="Uusi salasana">
        <TextEdit
          onChange={state.setNew}
          value={state.newPassword}
          type="password"
          name="new-password"
          autoCapitalize="off"
          autoCorrect="new-password"
          width="280px"
          error={newHasError}
          helperText={newHasError ? 'Salasana ei ole tarpeeksi hyvä' : undefined}
        />
      </ProfileItem>
      <ProfileItem title="Toista salasana">
        <TextEdit
          onChange={state.setNewRepeat}
          value={state.repeatPassword}
          type="password"
          name="new-password"
          autoCapitalize="off"
          autoCorrect="repeat-password"
          width="280px"
          error={repeatHasError}
          helperText={repeatHasError ? 'Salasanat eivät täsmää' : undefined}
        />
      </ProfileItem>
      <ProfileItem>
        <Button
          color="primary"
          disabled={!dataValid || isSaving}
          variant="contained"
          onClick={save}
          endIcon={isSaving ? <CircularProgress size="12pt" /> : null}
        >
          Vaihda salasana
        </Button>
        <Button
          color="secondary"
          variant="contained"
          disabled={!changed}
          onClick={() => state.reset()}
        >
          Palauta
        </Button>
      </ProfileItem>
    </>
  );
};

async function changeUserPassword(data: PasswordUpdate) {
  logger.info(data, `Changing password...`);
  await apiConnect.changeUserPassword(data);
  await updateSession();
  logger.info(`Data saved!`);
}
