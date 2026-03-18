import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import * as React from 'react';

import { Session } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

import { colorScheme } from '../Colors';
import { UploadImageButton } from '../component/UploadFileButton';
import { Subtitle } from '../design/Text';
import { RenderIcon } from '../icons/Icons';

const size = 128;

function isOwnImage(imageUrl: string | undefined): boolean {
  return !!imageUrl && !imageUrl.startsWith('http:') && !imageUrl.startsWith('https:');
}

export const ProfileImageView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;
  return (
    <>
      <FullWidth>
        <Subtitle>Profiilikuva</Subtitle>
      </FullWidth>
      <FullWidth>
        <ProfileImage image={user.imageLarge}>
          <IconPlacement>
            <UploadImageButton
              onSelect={uploadImage}
              style={{ backgroundColor: colorScheme.gray.standard + 'dd' }}
            >
              <RenderIcon icon="Upload" color="info" />
            </UploadImageButton>
            <ActionIcon
              variant="subtle"
              onClick={deleteImage}
              size="lg"
              style={{ backgroundColor: colorScheme.gray.standard + 'dd' }}
            >
              <RenderIcon icon="Delete" color="warning" />
            </ActionIcon>
          </IconPlacement>
        </ProfileImage>
      </FullWidth>
    </>
  );
};

async function uploadImage(file: any, filename: string) {
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

const ProfileImage: React.FC<React.PropsWithChildren<{ image?: string }>> = ({
  image,
  children,
}) => {
  const ownImage = isOwnImage(image);
  return (
    <ImgContainer>
      {image ? <Img src={image} className={ownImage ? 'own' : 'gravatar'} /> : null}
      {!ownImage ? <ImageInfo className="info">Gravatar</ImageInfo> : null}
      {children}
    </ImgContainer>
  );
};

const ImgContainer = styled.div`
  width: ${size}px;
  height: ${size}px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  &:hover {
    & > div.info {
      display: none;
    }
  }
`;

const Img = styled.img`
  width: ${size}px;
  height: ${size}px;
  border-radius: 50%;

  &.gravatar {
    filter: grayscale(100%) opacity(40%);

    &:hover {
      filter: none;
    }
  }
`;

const ImageInfo = styled.div`
  position: absolute;
  font-size: 14pt;
  z-index: 1;
`;

const IconPlacement = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;
