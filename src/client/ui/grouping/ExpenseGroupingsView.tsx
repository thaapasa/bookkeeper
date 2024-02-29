import styled from '@emotion/styled';
import { Chip, Grid, IconButton } from '@mui/material';
import React from 'react';

import { uri } from 'shared/net';
import { readableDateWithYear } from 'shared/time';
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
import { GroupedExpenseIcon } from './GroupedExpenseIcon';
import { editExpenseGrouping } from './GroupingEditor';
import { ExpenseGroupingsTagFilters, useFilterTags } from './useFilterTags';

export const ExpenseGroupingsList: React.FC<{
  data: ExpenseGrouping[];
  tags: string[];
  onReload: () => void;
}> = ({ data, tags, onReload }) => {
  const filters = useFilterTags();
  const filtered =
    !tags || tags.length < 1 ? data : data.filter(d => d.tags.some(t => tags.includes(t)));
  return (
    <>
      <Grid item xs={12} md={12} justifyContent="flex-end" container>
        <ExpenseGroupingsTagFilters allTags={tags} {...filters} />
      </Grid>
      {filtered.map(d => (
        <ExpenseGroupingView grouping={d} key={d.id} onReload={onReload} tags={filters.tags} />
      ))}
    </>
  );
};

export const ExpenseGroupingView: React.FC<{
  grouping: ExpenseGrouping;
  tags: string[];
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
          <PositionedIcon grouping={grouping} size={24} />
          {grouping.image ? <GroupingImage src={grouping.image} /> : null}
          <GroupingInfo>
            <InfoTextArea>
              {grouping.tags ? (
                <TagsList>
                  {grouping.tags.map(t => (
                    <TagChip label={t} key={t} variant="filled" size="small" />
                  ))}
                </TagsList>
              ) : null}
              <Sum>{Money.from(grouping.totalSum).format()}</Sum>
              <GroupingDates grouping={grouping} />
            </InfoTextArea>
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

const GroupingDates: React.FC<{ grouping: ExpenseGrouping }> = ({ grouping }) => {
  if (!grouping.startDate && !grouping.endDate) return null;
  if (!grouping.endDate) {
    return <DatesText>{readableDateWithYear(grouping.startDate, true)} →</DatesText>;
  }
  if (!grouping.startDate) {
    return <DatesText>→ {readableDateWithYear(grouping.endDate, true)}</DatesText>;
  }
  return (
    <DatesText>
      {readableDateWithYear(grouping.startDate, true)} -{' '}
      {readableDateWithYear(grouping.endDate, true)}
    </DatesText>
  );
};

async function deleteExpenseGrouping(grouping: ExpenseGrouping, onReload: () => void) {
  await executeOperation(() => apiConnect.deleteExpenseGrouping(grouping.id), {
    confirm: `Haluatko varmasti poistaa ryhmittelyn '${grouping.title}'?`,
    success: 'Ryhmittely poistettu!',
    postProcess: onReload,
  });
}

const TagsList = styled('div')`
  position: absolute;
  right: 8px;
  top: 8px;
`;

const TagChip = styled(Chip)`
  margin-left: 4px;
`;

const PositionedIcon = styled(GroupedExpenseIcon)`
  position: absolute;
  left: 8px;
`;

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
  height: 200px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
`;

const GroupingTotalsArea = styled(FlexRow)`
  position: relative;
  flex: 1;
`;

const InfoTextArea = styled(Flex)`
  display: inline-flex;
  flex-direction: column;
  flex: 1;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 0 16px;
`;

const Sum = styled('div')`
  ${TitleCss};
  color: ${colorScheme.secondary.dark};
`;

const DatesText = styled('div')``;

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
