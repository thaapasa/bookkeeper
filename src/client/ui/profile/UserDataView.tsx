import { Button, CircularProgress } from '@mui/material';
import React from 'react';
import { create } from 'zustand';

import { isEmail, Session } from 'shared/types';
import { UserDataUpdate } from 'shared/userData';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/State';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';
import { Text } from '../design/Text';
import { ProfileItem } from './ProfileItem';

export type UserDataState = UserDataUpdate & {
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  reset: (data?: UserDataUpdate) => void;
  saving: AsyncData<void>;
  setSaving: (savingState: AsyncData<void>) => void;
};

export const useUserDataState = create<UserDataState>(set => ({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  saving: UninitializedData,
  setFirstName: firstName => set({ firstName }),
  setLastName: lastName => set({ lastName }),
  setEmail: email => set({ email }),
  setUsername: username => set({ username }),
  reset: userData => set(userData ?? {}),
  setSaving: saving => set({ saving }),
}));

export const UserDataView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;

  const state = useUserDataState();

  const emailValid = isEmail(state.email);
  const dataValid = state.firstName && state.lastName && state.username && emailValid;
  const changed =
    state.firstName !== user.firstName ||
    state.lastName !== user.lastName ||
    state.email !== user.email ||
    state.username !== user.username;

  const isSaving = state.saving.type === 'loading';

  // Update data when session changes (upon reload)
  React.useEffect(() => {
    state.reset(session.user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const save = () => {
    if (!dataValid || !changed) {
      logger.debug('Skipping submit, no changes or invalid data');
      return;
    }
    executeOperation(() => saveUserData(state), {
      postProcess: () => notify('Profiilitiedot tallennettu!'),
      trackProgress: state.setSaving,
    });
  };

  return (
    <>
      <ProfileItem title="Käyttäjä-id">
        <Text>{user.id}</Text>
      </ProfileItem>
      <ProfileItem title="Nimi">
        <TextEdit
          onChange={state.setFirstName}
          value={state.firstName}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Selma"
          onSubmitEdit={save}
          width="120px"
          error={!state.firstName}
          disabled={isSaving}
        />
        <TextEdit
          onChange={state.setLastName}
          value={state.lastName}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Säästäjä"
          onSubmitEdit={save}
          width="200px"
          error={!state.lastName}
          disabled={isSaving}
        />
      </ProfileItem>
      <ProfileItem title="Sähköposti">
        <TextEdit
          onChange={state.setEmail}
          value={state.email}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="selma.saastaja@example.com"
          onSubmitEdit={save}
          width="280px"
          error={!emailValid}
          disabled={isSaving}
        />
      </ProfileItem>
      <ProfileItem title="Käyttäjätunnus">
        <TextEdit
          name="username"
          onChange={state.setUsername}
          value={state.username}
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="selma"
          onSubmitEdit={save}
          width="280px"
          error={!state.username}
          disabled={isSaving}
        />
      </ProfileItem>
      <ProfileItem>
        <Button
          color="primary"
          disabled={!dataValid || !changed || isSaving}
          variant="contained"
          onClick={save}
          endIcon={isSaving ? <CircularProgress size="12pt" /> : null}
        >
          Tallenna
        </Button>
        <Button
          color="secondary"
          variant="contained"
          disabled={!changed}
          onClick={() => state.reset(session.user)}
        >
          Palauta
        </Button>
      </ProfileItem>
    </>
  );
};

async function saveUserData(data: UserDataUpdate) {
  logger.info(data, `Saving data...`);
  await apiConnect.updateUserData(data);
  await updateSession();
  logger.info(`Data saved!`);
}
