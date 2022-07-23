import * as React from 'react';

import { isDefined } from 'shared/types/Common';

type ListDecoratorProps<T, R> = {
  /** Items to render */
  items: T[];
  /** Component that renders one item */
  itemRenderer: React.ComponentType<{ item: T; prev: T | null } & R>;
  /** Component that renders the separator between items */
  separator?: React.ComponentType<{ prev: T | null; next: T | null }>;
} & Omit<R, 'item' | 'prev'>;

export const ListDecorator = function <T, R>({
  items,
  separator,
  itemRenderer,
  ...rest
}: ListDecoratorProps<T, R>) {
  const ItemRenderer = itemRenderer;
  const Separator = separator;
  const pieces = items
    .map((item, idx) => [
      Separator ? (
        <Separator
          prev={idx > 0 ? items[idx - 1] : null}
          next={item}
          key={`separator-${idx}`}
        />
      ) : null,
      <ItemRenderer
        item={item}
        key={`item-${idx}`}
        prev={idx > 0 ? items[idx - 1] : null}
        {...(rest as any)}
      />,
    ])
    .flat(1);
  pieces.push(
    items.length > 0 ? (
      Separator ? (
        <Separator
          prev={items[items.length - 1]}
          next={null}
          key={`separator-${items.length}`}
        />
      ) : null
    ) : Separator ? (
      <Separator prev={null} next={null} key="separator-empty" />
    ) : null
  );
  return <>{pieces.filter(isDefined)}</>;
};
