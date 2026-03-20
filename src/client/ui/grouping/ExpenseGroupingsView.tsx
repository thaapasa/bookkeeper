import styled from '@emotion/styled';
import { ActionIcon, Badge } from '@mantine/core';
import React from 'react';

import { uri } from 'shared/net';
import { readableDateWithYear } from 'shared/time';
import { ExpenseGrouping } from 'shared/types';
import { hasMatchingElements, Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';
import { groupingsPagePath } from 'client/util/Links';

import { neutral, primary } from '../Colors';
import { FlexColumn, FlexRow } from '../component/BasicElements';
import { LinkButton } from '../component/TopBar';
import { Subtitle, TitleCss } from '../design/Text';
import { Icons } from '../icons/Icons';
import { Flex } from '../GlobalStyles';
import { media } from '../Styles';
import { GroupedExpenseIcon } from './GroupedExpenseIcon';
import { editExpenseGrouping } from './GroupingEditor';
import { ExpenseGroupingsTagFilters, useFilterTags } from './useFilterTags';

export const ExpenseGroupingsList: React.FC<{
  data: ExpenseGrouping[];
  allTags: string[];
  onReload: () => void;
}> = ({ data, allTags, onReload }) => {
  const filters = useFilterTags();
  const selectedTags = filters.tags ?? [];
  const filtered =
    selectedTags.length < 1 ? data : data.filter(d => hasMatchingElements(d.tags, selectedTags));
  return (
    <>
      <TagFilterRow>
        <ExpenseGroupingsTagFilters allTags={allTags} {...filters} />
      </TagFilterRow>
      <GroupingsGrid>
        {filtered.map(d => (
          <ExpenseGroupingView grouping={d} key={d.id} onReload={onReload} tags={filters.tags} />
        ))}
      </GroupingsGrid>
    </>
  );
};

export const ExpenseGroupingView: React.FC<{
  grouping: ExpenseGrouping;
  tags: string[];
  onReload: () => void;
}> = ({ grouping, onReload }) => {
  return (
    <GroupingCard>
      <TitleArea className="title-area">
        <TitleText>{grouping.title}</TitleText>
        <ToolsArea className="tools-area">
          <ActionIcon variant="subtle"
            size="sm"
            title="Muokkaa seurantaa"
            onClick={() => editExpenseGrouping(grouping.id)}
          >
            <Icons.Edit fontSize="small" />
          </ActionIcon>
          <ActionIcon variant="subtle"
            size="sm"
            onClick={() => deleteExpenseGrouping(grouping, onReload)}
          >
            <Icons.Delete fontSize="small" />
          </ActionIcon>
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
                  <Badge key={t} size="sm" variant="filled" style={{ marginLeft: 4 }}>
                    {t}
                  </Badge>
                ))}
              </TagsList>
            ) : null}
            <Sum>{Money.from(grouping.totalSum).format()}</Sum>
            <GroupingDates grouping={grouping} />
          </InfoTextArea>
          <ButtonRow>
            <LinkButton label="Kirjaukset" to={groupingsPagePath + uri`/${grouping.id}`} />
          </ButtonRow>
        </GroupingInfo>
      </GroupingTotalsArea>
    </GroupingCard>
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

const TagFilterRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const GroupingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  ${media.web`grid-template-columns: 1fr 1fr;`}
`;

const TagsList = styled.div`
  position: absolute;
  right: 8px;
  top: 8px;
`;

const PositionedIcon = styled(GroupedExpenseIcon)`
  position: absolute;
  left: 8px;
`;

const GroupingImage = styled.img`
  width: 168px;
  height: 168px;
`;

const TitleText = styled(Subtitle)`
  padding-left: 12px;
  padding-top: 2px;
  font-weight: 400;
  color: var(--mantine-color-text);
  border: none;
`;

const GroupingCard = styled(FlexColumn)`
  width: 100%;
  position: relative;
  border-radius: var(--mantine-radius-md);
  background-color: ${neutral[2]};
  overflow: hidden;
  height: 200px;
  box-shadow: var(--mantine-shadow-md);
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

const Sum = styled.div`
  ${TitleCss};
  color: ${primary[7]};
`;

const DatesText = styled.div``;

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

const TitleArea = styled.div`
  height: 32px;
  background-color: ${neutral[1]}aa;
  z-index: 1;
`;

const ToolsArea = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
`;
