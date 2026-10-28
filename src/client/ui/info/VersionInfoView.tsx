import { ActionIcon, Table, Tooltip } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { config } from 'client/Config';
import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { reloadApp } from 'client/util/ClientUtil';

import { Icons } from '../icons/Icons';
import { InfoSection } from './InfoLayoutElements';

// Plain useQuery instead of Suspense, so the client version shows even when the
// server does not answer.
export const VersionInfoView: React.FC = () => {
  const { data: server, isError } = useQuery({
    queryKey: QueryKeys.api.status,
    queryFn: () => apiConnect.getApiStatus(),
  });

  return (
    <InfoSection
      title="Versio"
      action={
        <Tooltip label="Lataa käyttöliittymä uudelleen">
          <ActionIcon size="lg" onClick={reloadApp} aria-label="Päivitä">
            <Icons.Refresh />
          </ActionIcon>
        </Tooltip>
      }
    >
      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td w={120}>Käli</Table.Td>
            <Table.Td>
              {config.version} ({config.revision})
            </Table.Td>
          </Table.Tr>
          {server || isError ? (
            <Table.Tr>
              <Table.Td>Palvelin</Table.Td>
              <Table.Td>
                {server
                  ? `${server.version} (${server.revision}, runtime ${server.runtimeVersion})`
                  : 'Ei saatavilla'}
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </InfoSection>
  );
};
