import * as React from 'react';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { ExpenseTypeIcon } from '../Icons';
import { stopEventPropagation } from '../../util/ClientUtil';
import { Source } from '../../../shared/types/Session';
import {
  ExpenseType,
  getExpenseTypeLabel,
  expenseTypes,
} from '../../../shared/types/Expense';
import { toMoment } from '../../../shared/util/Time';
import { IconButton } from 'material-ui';
import { VCenterRow } from '../Styles';
import { TextField } from '@material-ui/core';

const styles = {
  category: { width: '50%' },
};

// tslint:disable jsx-no-lambda
export function SumField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  return (
    <TextField
      placeholder="0.00"
      label="Summa"
      InputLabelProps={{ shrink: true }}
      value={props.value}
      helperText={props.errorText}
      error={Boolean(props.errorText)}
      onChange={e => props.onChange(e.target.value)}
    />
  );
}

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
    <div onKeyUp={stopEventPropagation}>
      <DropDownMenu
        key="category"
        value={props.category}
        style={styles.category}
        // autoWidth={false}
        // onKeyUp={stopEventPropagation}
        onChange={(i, j, v) => props.onChangeCategory(v)}
      >
        {props.categories.map(row => (
          <MenuItem key={row.id} value={row.id} primaryText={row.name} />
        ))}
      </DropDownMenu>
      <DropDownMenu
        key="subcategory"
        value={props.subcategory}
        style={styles.category}
        // autoWidth={false}
        // onKeyUp={stopEventPropagation}
        onChange={(i, j, v) => props.onChangeSubcategory(v)}
      >
        {props.subcategories.map(row => (
          <MenuItem key={row.id} value={row.id} primaryText={row.name} />
        ))}
      </DropDownMenu>
      {props.errorText
        ? [
            <br key="br" />,
            <div className="error-text" key="error">
              {props.errorText}
            </div>,
          ]
        : null}
    </div>
  );
}

export function SourceSelector(props: {
  value: number;
  onChange: (id: number) => void;
  sources: Source[];
  style?: React.CSSProperties;
}) {
  return (
    <DropDownMenu
      value={props.value}
      style={props.style}
      onChange={(event, index, sourceId) => props.onChange(sourceId)}
    >
      {props.sources.map(s => (
        <MenuItem key={s.id} value={s.id} primaryText={s.name} />
      ))}
    </DropDownMenu>
  );
}

export class TypeSelector extends React.Component<
  {
    value: ExpenseType;
    onChange: (s: ExpenseType) => void;
  },
  {}
> {
  private toggle = () => {
    const toggled =
      expenseTypes[
        (expenseTypes.indexOf(this.props.value) + 1) % expenseTypes.length
      ];
    if (toggled && this.props.onChange) {
      this.props.onChange(toggled);
    }
  };
  public render() {
    return (
      <VCenterRow>
        <IconButton onClick={this.toggle}>
          <ExpenseTypeIcon type={this.props.value} />
        </IconButton>
        {getExpenseTypeLabel(this.props.value)}
      </VCenterRow>
    );
  }
}

export function DateField(props: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  return (
    <DatePicker
      value={props.value}
      formatDate={d => toMoment(d).format('D.M.YYYY')}
      floatingLabelText="Päivämäärä"
      // floatingLabelFixed={true}
      fullWidth={true}
      autoOk={true}
      onChange={(event, date) => props.onChange(date)}
    />
  );
}

export function DescriptionField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  return (
    <TextField
      multiline={true}
      placeholder="Tarkempi selite"
      label="Selite"
      InputLabelProps={{ shrink: true }}
      fullWidth={true}
      helperText={props.errorText}
      error={Boolean(props.errorText)}
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
    />
  );
}
