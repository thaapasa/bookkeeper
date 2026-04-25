import { Group, Table, Tooltip } from '@mantine/core';

import { Tag } from '../../component/Tag';
import { ExpenseFilter } from './ExpenseFilters';
import { AllColumns } from './ExpenseTableColumns';

interface ExpenseFilterRowProps {
  filters: ExpenseFilter[];
  onRemoveFilter: (index: number) => void;
}

export function ExpenseFilterRow({ filters, onRemoveFilter }: ExpenseFilterRowProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <Table.Tr>
      <AllColumns>
        <Group w="100%" justify="center" gap="xs">
          {filters.map((f, index) => (
            <ExpenseFilterItem
              filter={f}
              index={index}
              key={`filter-${index}`}
              onRemove={onRemoveFilter}
            />
          ))}
        </Group>
      </AllColumns>
    </Table.Tr>
  );
}

interface ExpenseFilterItemProps {
  filter: ExpenseFilter;
  index: number;
  onRemove: (index: number) => void;
}

function ExpenseFilterItem({ filter, index, onRemove }: ExpenseFilterItemProps) {
  return (
    <Tooltip withArrow label={filter.name} position="bottom">
      <Tag size="xs" onRemove={() => onRemove(index)} maw={120}>
        {filter.name}
      </Tag>
    </Tooltip>
  );
}
