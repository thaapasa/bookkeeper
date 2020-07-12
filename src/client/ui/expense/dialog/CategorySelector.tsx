import * as React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@material-ui/core';
import styled from 'styled-components';
import { stopEventPropagation } from 'client/util/ClientUtil';

export function CategorySelector(props: {
  category: number;
  subcategory: number;
  categories: any[];
  subcategories: any[];
  onChangeCategory: (id: number) => void;
  onChangeSubcategory: (id: number) => void;
  errorText?: string;
  className?: string;
}) {
  const id = 'category-selector';
  return (
    <Row onKeyUp={stopEventPropagation} className={props.className}>
      <StyledControl className="category-control main-category">
        <InputLabel htmlFor={id} shrink={true}>
          Kategoria
        </InputLabel>
        <Select
          id={id}
          value={props.category}
          onChange={e => props.onChangeCategory(Number(e.target.value))}
        >
          <MenuItem value={0}>-- Valitse --</MenuItem>
          {props.categories.map(row => (
            <MenuItem key={row.id} value={row.id}>
              {row.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText error={!!props.errorText}>
          {props.errorText}
        </FormHelperText>
      </StyledControl>
      <StyledControl className="category-control sub-category">
        <InputLabel htmlFor={id} shrink={true}>
          Alikategoria
        </InputLabel>
        <Select
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
}

const Row = styled.div`
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
