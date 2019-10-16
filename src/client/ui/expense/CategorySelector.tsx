import * as React from 'react';
import { stopEventPropagation } from '../../util/ClientUtil';
import { Select, MenuItem } from '@material-ui/core';
import styled from 'styled-components';

const styles = {
  category: { width: '50%' },
};

export function CategorySelector(props: {
  category: number;
  subcategory: number;
  categories: any[];
  subcategories: any[];
  onChangeCategory: (id: number) => void;
  onChangeSubcategory: (id: number) => void;
  errorText?: string;
}) {
  return (
    <Row onKeyUp={stopEventPropagation}>
      <StyledSelect
        value={props.category}
        style={styles.category}
        onChange={e => props.onChangeCategory(Number(e.target.value))}
      >
        {props.categories.map(row => (
          <MenuItem key={row.id} value={row.id}>
            {row.name}
          </MenuItem>
        ))}
      </StyledSelect>
      <StyledSelect
        value={props.subcategory}
        style={styles.category}
        onChange={e => props.onChangeSubcategory(Number(e.target.value))}
      >
        {props.subcategories.map(row => (
          <MenuItem key={row.id} value={row.id}>
            {row.name}
          </MenuItem>
        ))}
      </StyledSelect>
      {props.errorText
        ? [
            <br key="br" />,
            <div className="error-text" key="error">
              {props.errorText}
            </div>,
          ]
        : null}
    </Row>
  );
}

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const StyledSelect = styled(Select)`
  margin: 8px;

  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
`;
