import styled from '@emotion/styled';
import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ExpenseGrouping, ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connect } from '../component/BaconConnect';
import { ColorPicker } from '../component/ColorPicker';
import { connectDialog } from '../component/DialogConnector';
import { OptionalDatePicker } from '../component/OptionalDatePicker';
import { Row } from '../component/Row';
import { TagsPicker } from '../component/TagsPicker';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadFileButton';
import { checkersBackground } from '../design/Background';
import { Subtitle } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { useGroupingState } from './GroupingEditorState';

interface GroupingBusPayload {
  groupingId: ObjectId | null;
}

const groupingBus = new B.Bus<GroupingBusPayload>();

export function editExpenseGrouping(groupingId: ObjectId) {
  groupingBus.push({ groupingId });
}

export function newExpenseGrouping() {
  groupingBus.push({ groupingId: null });
}

const GroupingDialogImpl: React.FC<{
  groupingId: ObjectId | null;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ groupingId, onClose, reloadAll }) => {
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getExpenseGrouping, true, groupingId, counter);
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent
        data={data}
        renderer={ConnectedEditView}
        onClose={onClose}
        reloadData={forceReload}
        reloadAll={reloadAll}
      />
    </Dialog>
  );
};

function getExpenseGrouping(
  groupingId: ObjectId | null,
  _counter: number,
): Promise<ExpenseGrouping | null> {
  return groupingId ? apiConnect.getExpenseGrouping(groupingId) : Promise.resolve(null);
}

const GroupingEditView: React.FC<{
  data: ExpenseGrouping | null;
  onClose: () => void;
  reloadData: () => void;
  reloadAll: () => void;
  categoryMap: CategoryMap;
}> = ({ data, onClose, reloadAll, reloadData, categoryMap }) => {
  const createNew = data === null;
  const state = useGroupingState();
  const tags = useAsyncData(apiConnect.getExpenseGroupingTags, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void state.reset(data), [data?.id]);
  return (
    <>
      <DialogTitle>{createNew ? 'Uusi ryhmittely' : 'Muokkaa ryhmittelyä'}</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <SelectionRow title="Nimi">
            <TextEdit value={state.title} onChange={state.setTitle} fullWidth />
          </SelectionRow>
          <SelectionRow title="Alkupäivä">
            <OptionalDatePicker value={state.startDate} onChange={state.setStartDate} />
          </SelectionRow>
          <SelectionRow title="Loppupäivä">
            <OptionalDatePicker value={state.endDate} onChange={state.setEndDate} />
          </SelectionRow>
          <SelectionRow title="Väri">
            <ColorPicker value={state.color} onChange={state.setColor} />
          </SelectionRow>
          <SelectionRow title="Tagit">
            <TagsPicker
              value={state.tags}
              onAdd={state.addTag}
              onRemove={state.removeTag}
              presetValues={tags.type === 'loaded' ? tags.value : []}
            />
          </SelectionRow>
          <SelectionRow title="Kuva">
            <Row>
              <ImageArea>
                {data?.image ? <GroupingImg src={data?.image} /> : <Icons.Image fontSize="large" />}
              </ImageArea>
              <Flex />
              <UploadImageButton
                onSelect={(file, filename) =>
                  state.uploadImage(file, filename, reloadData, reloadAll)
                }
                title="Lataa kuva"
              >
                <Icons.Upload />
              </UploadImageButton>
              <IconButton
                onClick={() => state.removeImage(reloadData, reloadAll)}
                title="Poista kuva"
              >
                <Icons.Delete />
              </IconButton>
            </Row>
          </SelectionRow>
          <Grid xs={12} item sx={{ position: 'relative' }}>
            <ToolIconArea>
              <IconButton title="Lisää kategoria" size="small" onClick={state.addCategory}>
                <Icons.Add fontSize="small" />
              </IconButton>
            </ToolIconArea>
            <Subtitle className="small">Kategoriat</Subtitle>
            {state.categories.map(c => (
              <CategorySelection id={c} key={c} categoryMap={categoryMap} />
            ))}
          </Grid>
          <Grid item xs={12}>
            <Row>
              <Flex />
              <Button color="inherit" onClick={onClose}>
                Peruuta
              </Button>
              <Button
                sx={{ marginLeft: 2 }}
                color="primary"
                variant="contained"
                disabled={!state.inputValid()}
                onClick={() => state.saveGrouping(onClose, reloadAll)}
              >
                Tallenna
              </Button>
            </Row>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

const SelectionRow: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <>
    <Grid item xs={4}>
      {title}
    </Grid>
    <Grid item xs={8}>
      {children}
    </Grid>
  </>
);

const ToolIconArea = styled('div')`
  position: absolute;
  right: 0;
  top: 8px;
`;

const ConnectedEditView = connect(B.combineTemplate({ categoryMap: categoryMapE }))(
  GroupingEditView,
);

const CategorySelection: React.FC<{ id: ObjectId; categoryMap: CategoryMap }> = ({
  id,
  categoryMap,
}) => {
  const state = useGroupingState();
  return (
    <Row>
      {getFullCategoryName(id, categoryMap)}
      <Flex />
      <IconButton
        title="Poista seurannasta"
        color="warning"
        size="small"
        onClick={() => state.removeCategory(id)}
      >
        <Icons.Delete fontSize="small" />
      </IconButton>
    </Row>
  );
};

export const GroupingEditor = connectDialog<GroupingBusPayload, { reloadAll: () => void }>(
  groupingBus,
  GroupingDialogImpl,
);

const ImageArea = styled('div')`
  width: 128px;
  height: 128px;
  position: relative;
  ${checkersBackground({ size: 8, color: '#eee' })}
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GroupingImg = styled('img')`
  width: 128px;
  height: 128px;
`;
