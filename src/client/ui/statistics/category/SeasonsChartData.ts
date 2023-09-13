import { getSeasonsInRange, Season, toSeason } from 'shared/time';
import { Category, CategoryStatistics, ObjectId } from 'shared/types';
import { Money, typedKeys } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { ChartColumn, ChartData } from 'client/ui/chart/ChartTypes';
import { fillMissingForNumericKeys } from 'client/ui/chart/ChartUtils';

import { ChartConfiguration } from './ChartTypes';

function categoryStatisticsToSeasonsData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>,
): ChartData<'season', number> {
  const keys = typedKeys(data.statistics);
  const allSeasions = getSeasonsInRange(data.range);
  const allData = Object.values(data.statistics).flat(1);

  const bySeasons: Record<Season, ChartColumn<'season', number>> = {};
  for (const stat of allData) {
    const season = toSeason(stat.month);
    bySeasons[season] ??= { season };
    bySeasons[season][stat.categoryId] = Money.from(bySeasons[season][stat.categoryId] ?? 0)
      .plus(stat.sum)
      .valueOf();
  }

  return {
    chartData: allSeasions
      .map(season => bySeasons[season] ?? { season })
      .map(d => fillMissingForNumericKeys(d, keys)),
    keys: keys.map((key, i) => ({
      key,
      color: getChartColor(i, 0),
      name: getFullCategoryName(Number(key), categoryMap),
      dataId: Number(key),
    })),
  };
}

const SeasonNames: Record<string, string> = {
  Spring: 'Kevät',
  Autumn: 'Syksy',
  Summer: 'Kesä',
  Winter: 'Talvi',
};
function formatSeason(season: Season) {
  const parts = season.split('-');
  return parts.length > 2
    ? `${SeasonNames[parts[2]]} ${parts[0]}-${parts[1]}`
    : `${SeasonNames[parts[1]]} ${parts[0]}`;
}

const SeasonConfig: ChartConfiguration<'season'> = {
  convertData: categoryStatisticsToSeasonsData,
  dataKey: 'season',
  tickFormatter: formatSeason,
  labelFormatter: formatSeason,
};

export function createSeasonsChartConfiguration(): ChartConfiguration<'season'> {
  return SeasonConfig;
}
