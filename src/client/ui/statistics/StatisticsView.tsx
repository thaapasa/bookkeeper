import * as React from 'react';

import { useList } from '../utils/Hooks';
import { StatisticsSourceView } from './StatisticsSourceView';

export const StatisticsView: React.FC = () => {
  const { list: cats, addItem: addCat } = useList<number>();

  return (
    <div>
      <StatisticsSourceView addCategory={addCat} />
      <div>Cats: {cats.join(',')}</div>
    </div>
  );
};
