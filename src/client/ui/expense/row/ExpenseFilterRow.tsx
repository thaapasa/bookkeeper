import { Group, Pill, Table, Tooltip } from '@mantine/core';

import { AllColumns } from './Breakpoints';
import styles from './ExpenseFilterRow.module.css';
import { ExpenseFilter } from './ExpenseFilters';

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
      <Pill className={styles.chip} withRemoveButton size="sm" onRemove={() => onRemove(index)}>
        {filter.name}
      </Pill>
    </Tooltip>
  );
}
