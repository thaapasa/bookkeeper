import React from 'react';

import { uniq } from 'shared/util';

import { Tag } from '../component/Tag';

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
          <Tag
            key={t}
            ml="xs"
            selectable
            selected={active}
            onSelect={() => addTag(t)}
            onRemove={() => removeTag(t)}
          >
            {t}
          </Tag>
        );
      })}
    </>
  );
}
