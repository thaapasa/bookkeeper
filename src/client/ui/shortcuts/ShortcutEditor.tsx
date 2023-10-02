import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/expense';
import { ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connectDialog } from '../component/DialogConnector';
import { Row } from '../component/Row';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadFileButton';
import { Subtitle } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { useShortcutState } from './ShortcutEditorState';
import { ShortcutLink } from './ShortcutLink';

const shortcutBus = new B.Bus<{ shortcutId: ObjectId }>();

export function editShortcut(shortcutId: ObjectId) {
  shortcutBus.push({ shortcutId });
}

const ShortcutDialogImpl: React.FC<{ shortcutId: ObjectId; onClose: () => void }> = ({
  shortcutId,
  onClose,
}) => {
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getShortcut, true, shortcutId, counter);
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent
        data={data}
        renderer={ShortcutEditView}
        onClose={onClose}
        reloadData={forceReload}
      />
    </Dialog>
  );
};

function getShortcut(shortcutId: ObjectId, _counter: number) {
  return apiConnect.getShortcut(shortcutId);
}

const ShortcutEditView: React.FC<{
  data: ExpenseShortcut;
  onClose: () => void;
  reloadData: () => void;
}> = ({ data, onClose, reloadData }) => {
  const state = useShortcutState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => state.reset(data), [data.id]);

  return (
    <>
      <DialogTitle>Muokkaa linkkiä</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <Grid item xs={4}>
            Nimi
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.title} onChange={state.setTitle} fullWidth />
          </Grid>
          <Grid item xs={4}>
            Taustaväri
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.background} onChange={state.setBackground} width="80px" />
          </Grid>
          <Grid item xs={4}>
            Linkin kuva
          </Grid>
          <Grid item xs={8}>
            <Row>
              <ShortcutIcon title={state.title} icon={data.icon} background={state.background} />
              <Flex />
              <TextEdit
                value={state.margin}
                onChange={state.setMargin}
                width="40px"
                label="Reuna"
              />
              <UploadImageButton
                onSelect={(file, filename) =>
                  state.uploadShortcutIcon(file, filename).then(reloadData)
                }
                title="Lataa kuva"
              >
                <Icons.Upload />
              </UploadImageButton>
              <IconButton onClick={state.removeIcon} title="Poista kuva">
                <Icons.Delete />
              </IconButton>
            </Row>
          </Grid>
          <Grid item xs={12}>
            <Subtitle>Linkin data</Subtitle>
          </Grid>
          <Grid item xs={12}>
            <TextEdit value={state.expenseStr} onChange={state.setExpense} multiline fullWidth />
          </Grid>
          <Grid item xs="auto">
            <Button color="inherit" onClick={onClose}>
              Peruuta
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button
              color="primary"
              variant="contained"
              disabled={!state.inputValid()}
              onClick={() => state.saveShortcut(onClose)}
            >
              Tallenna
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

const ShortcutIcon = styled(ShortcutLink)`
  margin: 0;
  margin-right: 4px;
`;

export const ShortcutEditor = connectDialog(shortcutBus, ShortcutDialogImpl);
