import { Avatar, Box, Button, Group, Stack, Text } from '@mantine/core';
import * as React from 'react';

import { Session } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';

function isOwnImage(imageUrl: string | undefined): boolean {
  return !!imageUrl && !imageUrl.startsWith('http:') && !imageUrl.startsWith('https:');
}

export const ProfileImageView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;
  return (
    <Stack>
      <Subtitle>Profiilikuva</Subtitle>
      <ImageSlot
        imageUrl={user.imageLarge}
        upload={apiConnect.uploadProfileImage}
        remove={apiConnect.deleteProfileImage}
        successUpload="Profiilikuva ladattu"
        successRemove="Profiilikuva poistettu"
        emptyOverlay="Gravatar"
      />

      <Subtitle>Tumma teema (valinnainen)</Subtitle>
      <ImageSlot
        imageUrl={user.imageDarkLarge}
        upload={apiConnect.uploadProfileImageDark}
        remove={apiConnect.deleteProfileImageDark}
        successUpload="Tumman teeman kuva ladattu"
        successRemove="Tumman teeman kuva poistettu"
        emptyHint="Ilman tätä kuvaa profiilikuvaa käytetään myös tummassa teemassa."
      />
    </Stack>
  );
};

interface ImageSlotProps {
  imageUrl: string | undefined;
  upload: (file: File, filename: string) => Promise<void>;
  remove: () => Promise<void>;
  successUpload: string;
  successRemove: string;
  /** Text painted over the avatar when the URL is a third-party fallback (e.g. Gravatar) */
  emptyOverlay?: string;
  /** Helper text shown below the slot when no own image is uploaded */
  emptyHint?: string;
}

const ImageSlot: React.FC<ImageSlotProps> = ({
  imageUrl,
  upload,
  remove,
  successUpload,
  successRemove,
  emptyOverlay,
  emptyHint,
}) => {
  const ownImage = isOwnImage(imageUrl);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await executeOperation(() => upload(file, file.name), {
      postProcess: updateSession,
      success: successUpload,
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = () =>
    executeOperation(() => remove(), {
      postProcess: updateSession,
      success: successRemove,
    });

  return (
    <Group gap="lg" align="center">
      <Box pos="relative">
        <Avatar
          src={imageUrl}
          size={128}
          radius="50%"
          style={ownImage ? undefined : { filter: 'grayscale(100%) opacity(40%)' }}
        />
        {!ownImage && emptyOverlay ? (
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
            {emptyOverlay}
          </Text>
        ) : null}
      </Box>
      <Stack gap="xs" w={240}>
        <Button
          variant="light"
          size="sm"
          leftSection={<Icons.Upload size={16} />}
          onClick={() => fileRef.current?.click()}
        >
          Lataa kuva
        </Button>
        {ownImage ? (
          <Button
            variant="light"
            color="red"
            size="sm"
            leftSection={<Icons.Delete size={16} />}
            onClick={handleDelete}
          >
            Poista
          </Button>
        ) : null}
        {!ownImage && emptyHint ? (
          <Text fz="xs" c="dimmed">
            {emptyHint}
          </Text>
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
  );
};
