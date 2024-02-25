import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
import React from 'react';

import { uri } from 'shared/net';
import { ExpenseGrouping } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';
import { groupingsPagePath } from 'client/util/Links';

import { colorScheme } from '../Colors';
import { FlexColumn, FlexRow } from '../component/BasicElements';
import { LinkButton } from '../component/NavigationBar';
import { Subtitle, TitleCss } from '../design/Text';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { editExpenseGrouping } from './GroupingEditor';

export const ExpenseGroupingsList: React.FC<{
  data: ExpenseGrouping[];
  onReload: () => void;
}> = ({ data, onReload }) => {
  return data.map(d => <ExpenseGroupingView grouping={d} key={d.id} onReload={onReload} />);
};

export const ExpenseGroupingView: React.FC<{
  grouping: ExpenseGrouping;
  onReload: () => void;
}> = ({ grouping, onReload }) => {
  return (
    <Grid item xs={12} md={6}>
      <GroupingCard>
        <TitleArea className="title-area">
          <TitleText>{grouping.title}</TitleText>
          <ToolsArea className="tools-area">
            <IconButton
              size="small"
              title="Muokkaa seurantaa"
              onClick={() => editExpenseGrouping(grouping.id)}
            >
              <Icons.Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="warning"
              onClick={() => deleteExpenseGrouping(grouping, onReload)}
            >
              <Icons.Delete fontSize="small" />
            </IconButton>
          </ToolsArea>
        </TitleArea>
        <GroupingTotalsArea className="grouping-totals-area">
          {grouping.image ? <GroupingImage src={grouping.image} /> : null}
          <GroupingInfo>
            <Sum>{Money.from(grouping.totalSum).format()}</Sum>
            <ButtonRow>
              <LinkButton
                label="Kirjaukset"
                to={groupingsPagePath + uri`/${grouping.id}`}
                variant="contained"
                color="primary"
              />
            </ButtonRow>
          </GroupingInfo>
        </GroupingTotalsArea>
      </GroupingCard>
    </Grid>
  );
};

async function deleteExpenseGrouping(grouping: ExpenseGrouping, onReload: () => void) {
  await executeOperation(() => apiConnect.deleteExpenseGrouping(grouping.id), {
    confirm: `Haluatko varmasti poistaa ryhmittelyn '${grouping.title}'?`,
    success: 'Ryhmittely poistettu!',
    postProcess: onReload,
  });
}

const GroupingImage = styled('img')`
  width: 168px;
  height: 168px;
`;

const TitleText = styled(Subtitle)`
  padding-left: 12px;
  padding-top: 2px;
  font-size: 14pt;
  font-weight: bold;
  border: none;
`;

const GroupingCard = styled(FlexColumn)`
  width: 100%;
  position: relative;
  border-radius: 8px;
  background-color: ${colorScheme.primary.standard};
  overflow: hidden;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
`;

const GroupingTotalsArea = styled(FlexRow)`
  flex: 1;
`;

const Sum = styled(Flex)`
  ${TitleCss};
  display: inline-flex;
  flex: 1;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const GroupingInfo = styled(FlexColumn)`
  flex: 1;
  justify-content: space-between;
  align-items: flex-start;
`;

const ButtonRow = styled(FlexRow)`
  width: 100%;
  padding: 16px;
  justify-content: flex-end;
  align-items: flex-end;
`;

const TitleArea = styled('div')`
  height: 32px;
  background-color: ${colorScheme.primary.light}aa;
  z-index: 1;
`;

const ToolsArea = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
`;
