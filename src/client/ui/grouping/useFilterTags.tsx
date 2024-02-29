import styled from '@emotion/styled';
import { Chip } from '@mui/material';
import React from 'react';

import { uniq } from 'shared/util';

export function useFilterTags() {
  const [tags, setTags] = React.useState<string[]>([]);
  return {
    tags,
    addTag: (tag: string) => {
      setTags([...new Set([...tags, tag])]);
    },
    removeTag: (tag: string) => setTags(tags.filter(t => t !== tag)),
  };
}

type FilterTagsData = ReturnType<typeof useFilterTags>;

export function ExpenseGroupingsTagFilters({
  allTags,
  tags,
  addTag,
  removeTag,
}: { allTags: string[] } & FilterTagsData) {
  const selected = new Set(tags);
  const joinedTags = uniq([...allTags, ...tags]);

  return (
    <>
      {joinedTags.map(t => {
        const active = selected.has(t);
        return (
          <FilterChip
            label={t}
            onDelete={active ? () => removeTag(t) : undefined}
            key={t}
            onClick={active ? undefined : () => addTag(t)}
            color={active ? 'info' : 'secondary'}
          />
        );
      })}
    </>
  );
}

const FilterChip = styled(Chip)`
  margin-left: 8px;
`;
