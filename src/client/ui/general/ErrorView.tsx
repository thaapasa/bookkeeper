import * as React from 'react';

import { NoteView } from './NoteView';

export const ErrorView: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <NoteView title={title} type="warning">
    {children}
  </NoteView>
);

export const PathNotFoundError: React.FC = () => (
  <ErrorView title="Hups">
    Tämä polku ei johda mihinkään. Palaa tästä <a href="/">etusivulle</a>!
  </ErrorView>
);
