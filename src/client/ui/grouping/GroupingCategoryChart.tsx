import styled from '@emotion/styled';
import * as B from 'baconjs';
import * as React from 'react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { CategoryMap, ExpenseGroupingCategoryTotal, isDefined, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney } from '../chart/Format';
import { colorScheme } from '../Colors';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { Flex } from '../Styles';

interface GroupingCategoryChartProps {
  categoryMap: CategoryMap;
  totals: ExpenseGroupingCategoryTotal[];
}

interface Data {
  name: string;
  categoryId: number;
  value: MoneyLike;
  color: string;
}

const GroupingCategoryChartImpl: React.FC<GroupingCategoryChartProps> = ({
  totals,
  categoryMap,
}) => {
  const data: Data[] = React.useMemo(() => {
    const colors = createColorScheme(totals, categoryMap);
    const d = totals.map<Data>(t => ({
      name: getFullCategoryName(t.categoryId, categoryMap),
      categoryId: t.categoryId,
      value: Money.from(t.sum).valueOf(),
      color: colors[t.categoryId],
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
  return (
    <Row>
      <Flex />
      <PieChart width={168} height={168}>
        <Pie data={data} cy="50%" cx="50%" outerRadius={80} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={formatMoney} />
      </PieChart>
      <CategoryTotalsTable data={data} />
      <Flex />
    </Row>
  );
};

const CategoryTotalsTable: React.FC<{ data: Data[] }> = ({ data }) => {
  const total = data.reduce((p, n) => p.plus(n.value), Money.from(0));
  return (
    <LegendTable>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <td style={{ color: d.color }}>{d.name}</td>
            <td>{Money.from(d.value).format()}</td>
          </tr>
        ))}
        <tr className="total">
          <td>Yhteensä</td>
          <td>{total.format()}</td>
        </tr>
      </tbody>
    </LegendTable>
  );
};

const LegendTable = styled('table')`
  margin-left: 16px;
  & td:last-child {
    text-align: right;
    padding-left: 32px;
  }
  & tr.total {
    font-weight: bold;
    td:first-of-type {
      color: ${colorScheme.secondary.dark};
    }
  }
`;

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
