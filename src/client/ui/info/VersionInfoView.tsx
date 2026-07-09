import { ActionIcon, Table, Tooltip } from '@mantine/core';
import * as React from 'react';

import { config } from 'client/Config';
import { apiConnect } from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { reloadApp } from 'client/util/ClientUtil';
import { infoPagePath } from 'client/util/Links';

import { Icons } from '../icons/Icons';
import { InfoSection } from './InfoLayoutElements';

interface VersionInfo {
  version: string;
  revision: string;
  runtimeVersion: string;
}

export const VersionInfoView = () => {
  const [serverVersion, setServerVersion] = React.useState<VersionInfo | null>(null);
  React.useEffect(() => {
    const loadVersion = async () => {
      const status = await apiConnect.getApiStatus();
      logger.info(status, `API status`);
      setServerVersion({
        version: status.version,
        revision: status.revision,
        runtimeVersion: status.runtimeVersion,
      });
    };
    loadVersion();
  }, []);
  const doReload = React.useCallback(() => reloadApp(infoPagePath), []);

  return (
    <InfoSection
      title="Versio"
      action={
        <Tooltip label="Lataa käyttöliittymä uudelleen">
          <ActionIcon size="lg" onClick={doReload} aria-label="Päivitä">
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
          {serverVersion ? (
            <Table.Tr>
              <Table.Td>Palvelin</Table.Td>
              <Table.Td>
                {serverVersion.version} ({serverVersion.revision}, runtime{' '}
                {serverVersion.runtimeVersion})
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </InfoSection>
  );
};
