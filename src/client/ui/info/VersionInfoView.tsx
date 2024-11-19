import { IconButton } from '@mui/material';
import * as React from 'react';

import { config } from 'client/Config';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { reloadApp } from 'client/util/ClientUtil';
import { infoPagePath } from 'client/util/Links';

import { Icons } from '../icons/Icons';
import { InfoItem, ItemWithId, Label, Value } from './InfoLayoutElements';

interface VersionInfo {
  version: string;
  revision: string;
  runtimeVersion: string;
}

export const VersionInfoView = () => {
  const [serverVersion, setServerVersion] = React.useState<VersionInfo | null>(null);
  React.useMemo(async () => {
    const status = await apiConnect.getApiStatus();
    logger.info(status, `API status`);
    setServerVersion({
      version: status.version,
      revision: status.revision,
      runtimeVersion: status.runtimeVersion,
    });
  }, [setServerVersion]);
  const doReload = React.useCallback(() => reloadApp(infoPagePath), []);

  return (
    <InfoItem>
      <Label>Versio</Label>
      <Value>
        <ItemWithId id="Käli">
          {config.version} ({config.revision})
        </ItemWithId>
        {serverVersion ? (
          <ItemWithId id="Palvelin">
            {serverVersion.version} ({serverVersion.revision}, runtime{' '}
            {serverVersion.runtimeVersion})
          </ItemWithId>
        ) : null}
        <ItemWithId id="Päivitä">
          <IconButton size="small" color="primary" onClick={doReload}>
            <Icons.Refresh />
          </IconButton>
        </ItemWithId>
      </Value>
    </InfoItem>
  );
};
