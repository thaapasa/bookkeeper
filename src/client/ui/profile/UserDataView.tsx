import { Button, CircularProgress } from '@mui/material';
import React from 'react';

import { isEmail, Session, toUserData, User, UserDataUpdate } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/State';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';
import { Text } from '../design/Text';
import { ProfileItem } from './ProfileItem';

type UpdateUserData = 'setFirstName' | 'setLastName' | 'setEmail';
type UserDataAction =
  | {
      type: UpdateUserData;
      value: string;
    }
  | { type: 'reset'; data?: User };

function userDataReducer(state: UserDataUpdate, action: UserDataAction): UserDataUpdate {
  switch (action.type) {
    case 'reset':
      return {
        firstName: action.data?.firstName ?? '',
        lastName: action.data?.lastName ?? '',
        email: action.data?.email ?? '',
      };
    case 'setFirstName':
      return { ...state, firstName: action.value };
    case 'setLastName':
      return { ...state, lastName: action.value };
    case 'setEmail':
      return { ...state, email: action.value };
    default:
      logger.warn(action, 'Unrecognized action');
      return state;
  }
}

export const UserDataView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;

  const [state, dispatch] = React.useReducer(userDataReducer, toUserData(session.user));
  const [saveOperation, setSaving] = React.useState<AsyncData<any>>(UninitializedData);

  const emailValid = isEmail(state.email);
  const dataValid = state.firstName && state.lastName && emailValid;
  const changed =
    state.firstName !== user.firstName ||
    state.lastName !== user.lastName ||
    state.email !== user.email;

  const isSaving = saveOperation.type === 'loading';

  // Update data when session changes (upon reload)
  React.useEffect(() => {
    dispatch({ type: 'reset', data: session.user });
  }, [session]);

  const save = () => {
    if (!dataValid || !changed) {
      logger.debug('Skipping submit, no changes or invalid data');
      return;
    }
    executeOperation(() => saveUserData(state), {
      postProcess: () => notify('Profiilitiedot tallennettu!'),
      trackProgress: setSaving,
    });
  };

  return (
    <>
      <ProfileItem title="Käyttäjä-id">
        <Text>{user.id}</Text>
      </ProfileItem>
      <ProfileItem title="Nimi">
        <TextEdit
          onChange={value => dispatch({ type: 'setFirstName', value })}
          value={state.firstName}
          placeholder="Selma"
          onSubmitEdit={save}
          width="120px"
          error={!state.firstName}
          disabled={isSaving}
        />
        <TextEdit
          onChange={value => dispatch({ type: 'setLastName', value })}
          value={state.lastName}
          placeholder="Säästäjä"
          onSubmitEdit={save}
          width="200px"
          error={!state.lastName}
          disabled={isSaving}
        />
      </ProfileItem>
      <ProfileItem title="Sähköposti">
        <TextEdit
          onChange={value => dispatch({ type: 'setEmail', value })}
          value={state.email}
          placeholder="selma.saastaja@example.com"
          onSubmitEdit={save}
          width="280px"
          error={!emailValid}
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
          onClick={() => dispatch({ type: 'reset', data: session.user })}
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
