import * as React from 'react';

import { ExpenseGroupingRef } from 'shared/types';
import { noop } from 'shared/util';
import { AutoComplete } from 'client/ui/component/AutoComplete';
import { GroupedExpenseIcon } from 'client/ui/grouping/GroupedExpenseIcon';

interface GroupingSelectorProps {
  value: number | null;
  onChange: (id: number | null) => void;
  groupings: ExpenseGroupingRef[];
  title: string;
}

export const GroupingSelector: React.FC<GroupingSelectorProps> = ({
  title,
  value,
  onChange,
  groupings,
}) => {
  const id = 'expense-dialog-grouping';
  const options = React.useMemo(() => [{ id: 0, title: 'Oletus' }, ...groupings], [groupings]);
  const selectedGrouping = groupings.find(g => g.id === value);
  const [text, setText] = React.useState(selectedGrouping?.title ?? '');
  return (
    <AutoComplete
      w="100%"
      id={id}
      value={text}
      label={title}
      suggestions={options}
      getSuggestionValue={g => g.title}
      onChange={setText}
      onUpdateSuggestions={noop}
      rightSection={
        selectedGrouping ? <GroupedExpenseIcon grouping={selectedGrouping} mt={5} /> : undefined
      }
      onSelectSuggestion={g => {
        onChange(g.id || null);
        setText(g.title);
      }}
    />
  );
};
