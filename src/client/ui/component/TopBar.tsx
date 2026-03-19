import styled from '@emotion/styled';
import { Button } from '@mantine/core';
import * as React from 'react';
import { Link, useMatch } from 'react-router-dom';

import { gray } from '../Colors';
import { Icon, RenderIcon } from '../icons/Icons';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean | number;
  icon?: Icon;
}

const PlainLink = styled(Link)`
  text-decoration: none;
`;

export const LinkButton: React.FC<{
  label: string;
  to: string;
  icon?: Icon;
}> = ({ label, to, icon }) => {
  const match = useMatch(to);
  return (
    <PlainLink to={to}>
      <Button
        variant="subtle"
        size="compact-sm"
        color={match ? 'accent' : 'dark'}
        leftSection={icon ? <RenderIcon icon={icon} /> : undefined}
        style={match ? undefined : { color: gray.veryDark }}
      >
        {label}
      </Button>
    </PlainLink>
  );
};
