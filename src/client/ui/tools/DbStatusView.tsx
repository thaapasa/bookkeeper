import { Code } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { DbStatus } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { logger } from 'client/Logger';

import { ErrorView } from '../general/ErrorView';
import { NoteView } from '../general/NoteView';
import { ToolButton } from './ToolButton';

export const DbStatusView: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QueryKeys.db.status,
    queryFn: loadDbStatus,
    enabled: false,
  });
  return (
    <>
      <ToolButton
        title="Tarkista tietokannan tila"
        buttonText="Tarkista"
        action={() => refetch()}
      />
      {isLoading ? (
        <NoteView title="Odota" noMargin>
          Ladataan...
        </NoteView>
      ) : error ? (
        <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
      ) : data ? (
        <RawDataView data={data} />
      ) : null}
    </>
  );
};

const RawDataView: React.FC<{ data: DbStatus }> = ({ data }) => (
  <NoteView title="Tietokannan tila">
    <Code block>{JSON.stringify(data, null, 2)}</Code>
  </NoteView>
);

async function loadDbStatus(): Promise<DbStatus> {
  const status = await apiConnect.getDbStatus();
  logger.info(status, 'DB status');
  return status;
}
