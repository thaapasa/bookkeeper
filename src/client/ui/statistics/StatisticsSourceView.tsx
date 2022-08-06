import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';
import styled from 'styled-components';

import {
  CategoryDataSource,
  categoryDataSourceP,
} from 'client/data/Categories';

import { connect } from '../component/BaconConnect';

const StatisticsSourceImpl: React.FC<{
  categorySource: CategoryDataSource[];
  addCategory: (cat: number) => void;
}> = ({ categorySource, addCategory }) => {
  return (
    <QueryArea>
      <Block>
        <Row className="top-align">
          <FormControl fullWidth>
            <InputLabel>Kategoria</InputLabel>
            <Select
              label="Kategoria"
              value={undefined}
              onChange={e => addCategory(Number(e.target.value))}
            >
              {categorySource.map(c => (
                <MenuItem key={c.value} value={c.value}>
                  {c.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Row>
      </Block>
    </QueryArea>
  );
};

export const StatisticsSourceView = connect(
  B.combineTemplate({
    categorySource: categoryDataSourceP,
  })
)(StatisticsSourceImpl);

const QueryArea = styled.div`
  margin: 24px 24px 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 96px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  &.top-margin {
    margin-top: 8px;
  }
  &.top-align {
    align-items: flex-start;
  }
`;
