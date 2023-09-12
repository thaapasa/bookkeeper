import { FormControl, FormHelperText, InputLabel, MenuItem, Select, styled } from '@mui/material';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { stopEventPropagation } from 'client/util/ClientUtil';

const id = 'category-selector';
export const CategorySelector: React.FC<{
  category: ObjectId;
  subcategory: ObjectId;
  categories: any[];
  subcategories: any[];
  onChangeCategory: (id: ObjectId) => void;
  onChangeSubcategory: (id: ObjectId) => void;
  errorText?: string;
  className?: string;
}> = props => (
  <Row onKeyUp={stopEventPropagation} className={props.className}>
    <StyledControl className="category-control main-category" variant="standard">
      <InputLabel htmlFor={`${id}-cat`} shrink={true}>
        Kategoria
      </InputLabel>
      <Select
        labelId={`${id}-cat`}
        value={props.category}
        onChange={e => props.onChangeCategory(Number(e.target.value))}
        label="Kategoria"
      >
        <MenuItem value={0}>-- Valitse --</MenuItem>
        {props.categories.map(row => (
          <MenuItem key={row.id} value={row.id}>
            {row.name}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText error={!!props.errorText}>{props.errorText}</FormHelperText>
    </StyledControl>
    <StyledControl className="category-control sub-category" variant="standard">
      <InputLabel htmlFor={`${id}-subcat`} shrink={true}>
        Alikategoria
      </InputLabel>
      <Select
        labelId={`${id}-subcat`}
        label="Alikategoria"
        value={props.subcategory}
        onChange={e => props.onChangeSubcategory(Number(e.target.value))}
      >
        <MenuItem value={0}>-- Valitse --</MenuItem>
        {props.subcategories.map(row => (
          <MenuItem key={row.id} value={row.id}>
            {row.name}
          </MenuItem>
        ))}
      </Select>
    </StyledControl>
  </Row>
);

const Row = styled('div')`
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: flex-start;
  justify-content: flex-start;
`;

const StyledControl = styled(FormControl)`
  width: 100%;
  box-sizing: border-box;
  margin: 0 8px;

  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
`;
