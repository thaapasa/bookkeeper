import { Avatar, Box, Button, Group, Stack, Text } from '@mantine/core';
import * as React from 'react';

import { Session } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';

function isOwnImage(imageUrl: string | undefined): boolean {
  return !!imageUrl && !imageUrl.startsWith('http:') && !imageUrl.startsWith('https:');
}

export const ProfileImageView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;
  const ownImage = isOwnImage(user.imageLarge);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, file.name);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Stack>
      <Subtitle>Profiilikuva</Subtitle>
      <Group gap="lg" align="center">
        <Box pos="relative">
          <Avatar
            src={user.imageLarge}
            size={128}
            radius="50%"
            style={ownImage ? undefined : { filter: 'grayscale(100%) opacity(40%)' }}
          />
          {!ownImage ? (
            <Text
              fz="xs"
              fw={700}
              c="var(--mantine-color-text)"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              Gravatar
            </Text>
          ) : null}
        </Box>
        <Stack gap="xs">
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<Icons.Upload size={16} />}
            onClick={() => fileRef.current?.click()}
          >
            Lataa kuva
          </Button>
          {ownImage ? (
            <Button
              variant="subtle"
              color="red"
              size="compact-sm"
              leftSection={<Icons.Delete size={16} />}
              onClick={deleteImage}
            >
              Poista
            </Button>
          ) : null}
        </Stack>
        <input
          type="file"
          ref={fileRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*"
        />
      </Group>
    </Stack>
  );
};

async function uploadImage(file: File, filename: string) {
  await executeOperation(() => apiConnect.uploadProfileImage(file, filename), {
    postProcess: updateSession,
    success: 'Profiilikuva ladattu',
  });
}

async function deleteImage() {
  await executeOperation(() => apiConnect.deleteProfileImage(), {
    postProcess: updateSession,
    success: 'Profiilikuva poistettu',
  });
}
