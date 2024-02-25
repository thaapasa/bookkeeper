import * as B from 'baconjs';
import * as React from 'react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';

import { CategoryMap, ExpenseGroupingCategoryTotal, isDefined, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney } from '../chart/Format';
import { connect } from '../component/BaconConnect';

interface GroupingCategoryChartProps {
  categoryMap: CategoryMap;
  totals: ExpenseGroupingCategoryTotal[];
}

const GroupingCategoryChartImpl: React.FC<GroupingCategoryChartProps> = ({
  totals,
  categoryMap,
}) => {
  const data: Data[] = React.useMemo(() => {
    const d = totals.map<Data>(t => ({
      name: getFullCategoryName(t.categoryId, categoryMap),
      categoryId: t.categoryId,
      value: Money.from(t.sum).valueOf(),
    }));
    d.sort((a, b) => {
      const ca = categoryMap[a.categoryId];
      const cb = categoryMap[b.categoryId];
      if (ca.parentId !== cb.parentId) {
        if (!isDefined(ca.parentId)) {
          return -1;
        }
        if (!isDefined(cb.parentId)) {
          return 1;
        }
        return ca.parentId - cb.parentId;
      }
      if (ca.id !== cb.id) return ca.id - cb.id;
      return 0;
    });
    return d;
  }, [totals, categoryMap]);
  if (totals.length < 1) return null;
  const colors = createColorScheme(totals, categoryMap);
  return (
    <PieChart width={450} height={168}>
      <Pie data={data} cy="50%" cx="50%" outerRadius={80} dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[entry.categoryId]} />
        ))}
      </Pie>
      <Legend layout="vertical" align="right" />
      <Tooltip formatter={formatMoney} />
    </PieChart>
  );
};

interface Data {
  name: string;
  categoryId: number;
  value: MoneyLike;
}

function createColorScheme(
  totals: ExpenseGroupingCategoryTotal[],
  categoryMap: CategoryMap,
): Record<ObjectId, string> {
  const colors: Record<ObjectId, string> = {};
  const parentIds = new Set(
    totals.map(t => categoryMap[t.categoryId]).map(t => t.parentId ?? t.id),
  );
  if (parentIds.size > 1) {
    const parentCounters: Record<ObjectId, number> = {};
    const parentIdxs: Record<ObjectId, number> = {};
    let nextParentIdx = 0;
    totals.forEach(t => {
      const cat = categoryMap[t.categoryId];
      const parentId = cat.parentId ?? cat.id;
      if (parentIdxs[parentId] === undefined) {
        parentIdxs[parentId] = nextParentIdx;
        nextParentIdx += 3;
      }
      const pIdx = parentIdxs[parentId];
      parentCounters[parentId] = (parentCounters[parentId] ?? -1) + 1;
      colors[t.categoryId] = getChartColor(pIdx, parentCounters[parentId]);
    });
  } else {
    // Only one main category
    totals.forEach((t, i) => (colors[t.categoryId] = getChartColor(i, 0)));
  }
  return colors;
}

export const GroupingCategoryChart = connect(B.combineTemplate({ categoryMap: categoryMapE }))(
  GroupingCategoryChartImpl,
);
