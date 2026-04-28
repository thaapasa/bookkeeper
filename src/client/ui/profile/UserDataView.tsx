import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import React from 'react';
import { create } from 'zustand';

import { isEmail, Session } from 'shared/types';
import { UserDataUpdate } from 'shared/userData';
import { apiConnect } from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/NotificationStore';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';

export type UserDataState = UserDataUpdate & {
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  reset: (data?: UserDataUpdate) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

export const useUserDataState = create<UserDataState>(set => ({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  saving: false,
  setFirstName: firstName => set({ firstName }),
  setLastName: lastName => set({ lastName }),
  setEmail: email => set({ email }),
  setUsername: username => set({ username }),
  reset: userData => set(userData ?? {}),
  setSaving: saving => set({ saving }),
}));

function toUserDataUpdate(state: UserDataState): UserDataUpdate {
  return {
    firstName: state.firstName,
    lastName: state.lastName,
    username: state.username,
    email: state.email,
  };
}

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

  const isSaving = state.saving;

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
    executeOperation(() => saveUserData(toUserDataUpdate(state)), {
      postProcess: () => notify('Profiilitiedot tallennettu!'),
      trackProgress: state.setSaving,
    });
  };

  return (
    <Stack>
      <Group>
        <Text>Käyttäjä-id: {user.id}</Text>
      </Group>
      <Group>
        <TextEdit
          onChange={state.setFirstName}
          value={state.firstName}
          label="Etunimi"
          autoCapitalize="none"
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
          label="Sukunimi"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="Säästäjä"
          onSubmitEdit={save}
          width="200px"
          error={!state.lastName}
          disabled={isSaving}
        />
      </Group>
      <TextEdit
        onChange={state.setEmail}
        value={state.email}
        label="Sähköposti"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="selma.saastaja@example.com"
        onSubmitEdit={save}
        width="280px"
        error={!emailValid}
        disabled={isSaving}
      />
      <TextEdit
        name="username"
        onChange={state.setUsername}
        label="Käyttäjätunnus"
        value={state.username}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="selma"
        onSubmitEdit={save}
        width="280px"
        error={!state.username}
        disabled={isSaving}
      />
      <Group>
        <Button disabled={!dataValid || !changed || isSaving} onClick={save}>
          {isSaving ? <Loader size="xs" /> : null}
          Tallenna
        </Button>
        <Button variant="light" disabled={!changed} onClick={() => state.reset(session.user)}>
          Palauta
        </Button>
      </Group>
    </Stack>
  );
};

async function saveUserData(data: UserDataUpdate) {
  logger.info(data, `Saving data...`);
  await apiConnect.updateUserData(data);
  await updateSession();
  logger.info(`Data saved!`);
}
