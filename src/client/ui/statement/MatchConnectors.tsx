import { Box } from '@mantine/core';
import React from 'react';

/**
 * SVG connector overlay for the matching view: draws bezier lines from
 * expense cards to the statement row cards they are linked to. The parent
 * registers card DOM nodes via useCardRefs and renders MatchConnectors as
 * the first child of a position: relative container.
 */

export type ConnectorKind = 'match' | 'suggestion' | 'selection';

export interface ConnectorSpec {
  expenseId: number;
  rowId: number;
  kind: ConnectorKind;
}

export const expenseCardKey = (id: number) => `e-${id}`;
export const rowCardKey = (id: number) => `r-${id}`;

export function useCardRefs() {
  const cards = React.useRef(new Map<string, HTMLDivElement>());
  const registerCard = React.useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) {
        cards.current.set(key, el);
      } else {
        cards.current.delete(key);
      }
    },
    [],
  );
  return { cards, registerCard };
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: ConnectorKind;
}

const lineStyles: Record<ConnectorKind, React.SVGAttributes<SVGPathElement>> = {
  match: {
    stroke: 'var(--mantine-color-neutral-5)',
    strokeWidth: 1.5,
    opacity: 0.9,
  },
  suggestion: {
    stroke: 'var(--mantine-color-primary-4)',
    strokeWidth: 1.5,
    strokeDasharray: '5 4',
    opacity: 0.8,
  },
  selection: {
    stroke: 'var(--mantine-color-primary-7)',
    strokeWidth: 2.5,
  },
};

export const MatchConnectors: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  cards: React.RefObject<Map<string, HTMLDivElement>>;
  connectors: ConnectorSpec[];
}> = ({ containerRef, cards, connectors }) => {
  const [lines, setLines] = React.useState<Line[]>([]);

  const measure = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setLines([]);
      return;
    }
    const origin = container.getBoundingClientRect();
    const result: Line[] = [];
    for (const c of connectors) {
      const expenseEl = cards.current?.get(expenseCardKey(c.expenseId));
      const rowEl = cards.current?.get(rowCardKey(c.rowId));
      if (!expenseEl || !rowEl) {
        continue;
      }
      const e = expenseEl.getBoundingClientRect();
      const r = rowEl.getBoundingClientRect();
      result.push({
        x1: e.right - origin.left,
        y1: e.top + e.height / 2 - origin.top,
        x2: r.left - origin.left,
        y2: r.top + r.height / 2 - origin.top,
        kind: c.kind,
      });
    }
    setLines(result);
  }, [containerRef, cards, connectors]);

  // Re-measure when the connectors change and when the layout shifts
  // (cards mount, window resizes, content above grows/shrinks). A plain
  // effect (post-paint) so all sibling card refs are attached regardless of
  // render order.
  React.useEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure, containerRef]);

  if (lines.length < 1) {
    return null;
  }
  return (
    <Box
      component="svg"
      pos="absolute"
      top={0}
      left={0}
      w="100%"
      h="100%"
      style={{ pointerEvents: 'none', overflow: 'visible', zIndex: 1 }}
    >
      {lines.map((line, i) => {
        const midX = (line.x1 + line.x2) / 2;
        return (
          <path
            key={i}
            d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
            fill="none"
            {...lineStyles[line.kind]}
          />
        );
      })}
    </Box>
  );
};
