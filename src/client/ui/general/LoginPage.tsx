import { Box, Button, Paper, Stack, Text } from '@mantine/core';
import * as React from 'react';

import { pickRandomItem } from 'shared/util';
import { login } from 'client/data/Login';

import { TextEdit } from '../component/TextEdit';
import styles from './LoginPage.module.css';

const publicUrl = import.meta.env.PUBLIC_URL || '';

const backgroundImages = ['money-bg.webp', 'money-bg-1.webp', 'money-bg-2.webp'];

export const LoginPage: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const bgImage = React.useMemo(() => pickRandomItem(backgroundImages), []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    try {
      await login(username, password);
    } catch (er: unknown) {
      if (er instanceof Object && 'status' in er && er.status === 401) {
        setStatusMessage(
          'Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.',
        );
      } else {
        setStatusMessage('Kirjautumisessa tapahtui virhe.');
      }
    }
  };

  return (
    <Box className={styles.page} style={{ backgroundImage: `url(${publicUrl}/img/${bgImage})` }}>
      <Paper shadow="sm" radius="md" p="xl" mt="15vh" mx="xl" style={{ zIndex: 1 }}>
        <Stack component="form" onSubmit={handleSubmit} gap={0} w={280}>
          <Text ta="center" mb="3vh">
            Kirjaudu sisään
          </Text>
          <TextEdit
            placeholder="Käyttäjätunnus"
            label="Käyttäjätunnus"
            name="username"
            value={username}
            onChange={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect="off"
            autoFocus={true}
            mt="xs"
          />
          <TextEdit
            placeholder="Salasana"
            label="Salasana"
            name="password"
            type="password"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            value={password}
            onChange={setPassword}
            mt="xs"
          />
          <Button type="submit" fullWidth mt="xl">
            Kirjaudu
          </Button>
          {statusMessage !== null ? (
            <Text c="primary.7" ta="center" mt="3vh">
              {statusMessage}
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
};
