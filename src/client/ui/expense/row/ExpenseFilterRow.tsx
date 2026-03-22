import { Group, Pill, Tooltip } from '@mantine/core';

import styles from './ExpenseFilterRow.module.css';
import { ExpenseFilter } from './ExpenseFilters';
import { AllColumns, Row } from './ExpenseTableLayout';

interface ExpenseFilterRowProps {
  filters: ExpenseFilter[];
  onRemoveFilter: (index: number) => void;
}

export function ExpenseFilterRow({ filters, onRemoveFilter }: ExpenseFilterRowProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <Row>
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
    </Row>
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
