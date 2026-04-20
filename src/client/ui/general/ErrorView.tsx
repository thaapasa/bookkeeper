import { CardProps } from '@mantine/core';
import * as React from 'react';

import { PageLayout } from '../layout/PageLayout';
import { NoteView } from './NoteView';

export const ErrorView: React.FC<
  React.PropsWithChildren<{ title: string; className?: string }> & CardProps
> = ({ title, children, ...props }) => (
  <NoteView title={title} type="warning" {...props}>
    {children}
  </NoteView>
);

export const PathNotFoundError: React.FC = () => (
  <PageLayout py="md">
    <ErrorView title="Hups">
      Tämä polku ei johda mihinkään. Palaa tästä <a href="/">etusivulle</a>!
    </ErrorView>
  </PageLayout>
);
