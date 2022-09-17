import { getQuartersInRange, Quarter, toQuarter } from 'shared/time';
import { Category, CategoryStatistics, ObjectId } from 'shared/types';
import { Money, typedKeys } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { ChartColumn, ChartData } from 'client/ui/chart/ChartTypes';
import { fillMissingForNumericKeys } from 'client/ui/chart/ChartUtils';

export function categoryStatisticsToQuartersData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>
): ChartData<'quarter', number> {
  const keys = typedKeys(data.statistics);
  const allQuarters = getQuartersInRange(data.range);
  const allData = Object.values(data.statistics).flat(1);

  const byQuarters: Record<Quarter, ChartColumn<'quarter', number>> = {};
  for (const stat of allData) {
    const quarter = toQuarter(stat.month);
    byQuarters[quarter] ??= { quarter };
    byQuarters[quarter][stat.categoryId] = Money.from(
      byQuarters[quarter][stat.categoryId] ?? 0
    )
      .plus(stat.sum)
      .valueOf();
  }

  return {
    chartData: allQuarters
      .map(quarter => byQuarters[quarter] ?? { quarter })
      .map(d => fillMissingForNumericKeys(d, keys)),
    keys: keys.map((key, i) => ({
      key,
      color: getChartColor(i, 0),
      name: getFullCategoryName(Number(key), categoryMap),
      dataId: Number(key),
    })),
  };
}
