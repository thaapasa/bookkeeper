import { Box, Button, Loader } from '@mantine/core';
import React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { create } from 'zustand';

import { Session } from 'shared/types';
import { isPassword, PasswordUpdate } from 'shared/userData';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/State';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';
import { passwordPagePath, profilePagePath } from 'client/util/Links';

import { TextEdit } from '../component/TextEdit';
import { Subtitle } from '../design/Text';
import { ProfileItem } from './ProfileItem';

export type PasswordState = PasswordUpdate & {
  repeatPassword: string;
  setCurrent: (password: string) => void;
  setNew: (password: string) => void;
  setNewRepeat: (password: string) => void;
  reset: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

export const usePasswordState = create<PasswordState>(set => ({
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
  reset: () => set({ currentPassword: '', newPassword: '', repeatPassword: '' }),
  saving: false,
  setCurrent: currentPassword => set({ currentPassword }),
  setNew: newPassword => set({ newPassword }),
  setNewRepeat: repeatPassword => set({ repeatPassword }),
  setSaving: saving => set({ saving }),
}));

function toPasswordUpdate(state: PasswordState): PasswordUpdate {
  return { currentPassword: state.currentPassword, newPassword: state.newPassword };
}

export const PasswordChangeView: React.FC<{ session: Session }> = ({ session }) => {
  const state = usePasswordState();
  const navigate = useNavigate();

  const newPasswordValid = isPassword(state.newPassword);
  const passwordsMatch = state.newPassword === state.repeatPassword;
  const dataValid = state.currentPassword && newPasswordValid && passwordsMatch;
  const newHasError = !!state.newPassword && !newPasswordValid;
  const repeatHasError = !!state.repeatPassword && !passwordsMatch;
  const changed = state.newPassword || state.currentPassword || state.repeatPassword;

  const isSaving = state.saving;

  const save = () => {
    if (!dataValid || !changed) {
      logger.debug('Skipping submit, no changes or invalid data');
      return;
    }
    executeOperation(() => changeUserPassword(toPasswordUpdate(state)), {
      postProcess: () => {
        notify('Salasana vaihdettu!');
        state.reset();
        navigate(profilePagePath);
      },
      trackProgress: state.setSaving,
    });
  };

  return (
    <>
      <form id="change-password" onSubmit={save}>
        {/** Included for password managers */}
        <input type="hidden" name="username" value={session.user.username} />
        <ProfileItem title="Nykyinen salasana" labelFor="current-password">
          <TextEdit
            id="current-password"
            onChange={state.setCurrent}
            value={state.currentPassword}
            type="password"
            name="current-password"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            width="280px"
            onSubmitEdit={save}
          />
        </ProfileItem>
        <ProfileItem title="Uusi salasana" labelFor="new-password">
          <TextEdit
            id="new-password"
            onChange={state.setNew}
            value={state.newPassword}
            type="password"
            name="new-password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            width="280px"
            error={newHasError ? 'Salasana ei ole tarpeeksi hyvä' : undefined}
            onSubmitEdit={save}
          />
        </ProfileItem>
        <ProfileItem title="Toista salasana" labelFor="confirm-password">
          <TextEdit
            id="confirm-password"
            onChange={state.setNewRepeat}
            value={state.repeatPassword}
            type="password"
            name="confirm-password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            width="280px"
            error={repeatHasError ? 'Salasanat eivät täsmää' : undefined}
            onSubmitEdit={save}
          />
        </ProfileItem>
        <ProfileItem>
          <Button disabled={!dataValid || isSaving} onClick={save}>
            {isSaving ? <Loader size="xs" /> : null}
            Vaihda salasana
          </Button>
          <Button variant="light" onClick={() => navigate(-1)}>
            Peruuta
          </Button>
        </ProfileItem>
      </form>
    </>
  );
};

export const PasswordView: React.FC<{ session: Session }> = ({ session }) => {
  const navigate = useNavigate();
  return (
    <>
      <Box style={{ gridColumn: '1 / -1' }}>
        <Subtitle>Salasana</Subtitle>
      </Box>

      <Routes>
        <Route path="/salasana" element={<PasswordChangeView session={session} />}></Route>
        <Route
          path="/*"
          element={
            <ProfileItem title="Vaihda salasana">
              <Button onClick={() => navigate(passwordPagePath)}>Vaihda</Button>
            </ProfileItem>
          }
        ></Route>
      </Routes>
    </>
  );
};

async function changeUserPassword(data: PasswordUpdate) {
  logger.info(data, `Changing password...`);
  await apiConnect.changeUserPassword(data);
  await updateSession();
  logger.info(`Data saved!`);
}
