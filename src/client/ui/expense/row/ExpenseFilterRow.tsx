import { Group, Pill, Table, Tooltip } from '@mantine/core';

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
      <Pill
        bg="light-dark(var(--mantine-color-neutral-2), var(--mantine-color-neutral-4))"
        c="primary-7"
        maw={120}
        withRemoveButton
        size="sm"
        onRemove={() => onRemove(index)}
      >
        {filter.name}
      </Pill>
    </Tooltip>
  );
}
