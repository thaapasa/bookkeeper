import styled from '@emotion/styled';
import { FormControl, InputLabel } from '@mui/material';
import * as React from 'react';

import { ExpenseGroupingRef } from 'shared/types';
import { noop } from 'shared/util';
import { AutoComplete } from 'client/ui/component/AutoComplete';
import { GroupedExpenseIcon } from 'client/ui/grouping/GroupedExpenseIcon';

export const GroupingSelector: React.FC<{
  value: number | null;
  onChange: (id: number | null) => void;
  groupings: ExpenseGroupingRef[];
  style?: React.CSSProperties;
  title: string;
}> = ({ title, value, style, onChange, groupings }) => {
  const id = 'expense-dialog-grouping';
  const options = React.useMemo(() => [{ id: 0, title: 'Oletus' }, ...groupings], [groupings]);
  const selectedGrouping = groupings.find(g => g.id === value);
  const [text, setText] = React.useState(selectedGrouping?.title ?? '');
  return (
    <Container>
      {selectedGrouping ? (
        <IconPosition>
          <GroupedExpenseIcon grouping={selectedGrouping} />
        </IconPosition>
      ) : null}
      <FormControl fullWidth={true} variant="standard">
        <InputLabel htmlFor={id} shrink={true}>
          {title}
        </InputLabel>
        <AutoComplete
          id={id}
          value={text}
          style={style}
          label={title}
          suggestions={options}
          getSuggestionValue={g => g.title}
          onChange={setText}
          onUpdateSuggestions={noop}
          onSelectSuggestion={g => {
            onChange(g.id || null);
            setText(g.title);
          }}
        />
      </FormControl>
    </Container>
  );
};

const Container = styled('div')`
  position: relative;
  width: 100%;
`;

const IconPosition = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
`;
