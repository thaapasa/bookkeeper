import { IconButton } from '@mui/material';
import debug from 'debug';
import * as React from 'react';

import { reloadApp } from 'shared/util/UrlUtils';
import { config } from 'client/Config';
import apiConnect from 'client/data/ApiConnect';
import { infoPagePath } from 'client/util/Links';

import { Refresh } from '../Icons';
import { InfoItem, ItemWithId, Label, Value } from './InfoLayoutElements';

const log = debug('bookkeeper:version');

interface VersionInfo {
  version: string;
  revision: string;
}

export const VersionInfoView = () => {
  const [serverVersion, setServerVersion] = React.useState<VersionInfo | null>(
    null
  );
  React.useMemo(async () => {
    const status = await apiConnect.getApiStatus();
    log(`API status`, status);
    setServerVersion({ version: status.version, revision: status.revision });
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
            {serverVersion.version} ({serverVersion.revision})
          </ItemWithId>
        ) : null}
        <ItemWithId id="Päivitä">
          <IconButton size="small" color="primary" onClick={doReload}>
            <Refresh />
          </IconButton>
        </ItemWithId>
      </Value>
    </InfoItem>
  );
};
