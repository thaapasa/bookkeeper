import * as React from 'react';

import { DbStatus } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';

import { AsyncDataView } from '../component/AsyncDataView';
import { NoteView } from '../general/NoteView';
import { useDeferredData } from '../hooks/useAsyncData';
import { Pre } from '../Styles';
import { ToolButton } from './ToolButton';

export const DbStatusView: React.FC = () => {
  const { data, loadData } = useDeferredData(loadDbStatus, true);
  return (
    <>
      <ToolButton title="Tarkista tietokannan tila" buttonText="Tarkista" action={loadData} />
      <AsyncDataView hideUninitialized data={data} renderer={RawDataView} />
    </>
  );
};

const RawDataView: React.FC<{ data: DbStatus }> = ({ data }) => (
  <NoteView title="Tietokannan tila">
    <Pre>{JSON.stringify(data, null, 2)}</Pre>
  </NoteView>
);

async function loadDbStatus(): Promise<DbStatus> {
  const status = await apiConnect.getDbStatus();
  logger.info(status, 'DB status');
  return status;
}
