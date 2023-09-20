import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import React from 'react';

import { Session } from 'shared/types';

import { Subtitle } from '../design/Text';
import { imageUrlForWidth, isOwnImage } from './ProfileImage';

const size = 140;

export const ProfileImageView: React.FC<{ session: Session }> = ({ session }) => {
  const user = session.user;
  return (
    <>
      <Grid item xs={12}>
        <Subtitle>Profiilikuva</Subtitle>
      </Grid>
      <Grid item xs={12}>
        <ProfileImage image={user.image} />
      </Grid>
    </>
  );
};

const ProfileImage: React.FC<{ image?: string }> = ({ image }) => {
  const ownImage = isOwnImage(image);
  return (
    <ImgContainer>
      {image ? (
        <Img src={imageUrlForWidth(image, size)} className={ownImage ? 'own' : 'gravatar'} />
      ) : null}
      {!ownImage ? <ImageInfo>Gravatar</ImageInfo> : null}
    </ImgContainer>
  );
};

const ImgContainer = styled('div')`
  width: ${size}px;
  height: ${size}px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  &:hover {
    & > div {
      display: none;
    }
  }
`;

const Img = styled('img')`
  width: ${size}px;
  height: ${size}px;

  &.own {
  }

  &.gravatar {
    filter: grayscale(100%) opacity(40%);

    &:hover {
      filter: none;
    }
  }
`;

const ImageInfo = styled('div')`
  position: absolute;
  font-size: 14pt;
`;
