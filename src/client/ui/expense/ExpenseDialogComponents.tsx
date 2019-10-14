import * as React from 'react';
import * as Bacon from 'baconjs';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { ExpenseTypeIcon } from '../Icons';
import apiConnect from '../../data/ApiConnect';
import { PlainAutoComplete } from '../component/PlainTextField';
import { stopEventPropagation, unsubscribeAll } from '../../util/ClientUtil';
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
import AutoComplete from '../component/AutoComplete';

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

export function TitleField<T>(props: {
  value: string;
  errorText?: string;
  dataSource: T[];
  onChange: (s: string) => void;
  onSelect: (s: number) => void;
}) {
  return (
    <AutoComplete
      value={props.value}
      onChange={props.onChange}
      placeholder="Ruokaostokset"
      label="Kuvaus"
      errorText={props.errorText}
      fullWidth={true}
      getSuggestions={input =>
        props.dataSource.filter(d =>
          String(d)
            .toLowerCase()
            .startsWith(input.toLowerCase())
        )
      }
      getSuggestionValue={i => String(i)}
      renderSuggestion={s => String(s)}
      onSelectSuggestion={s => props.onChange(String(s))}
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

interface ReceiverFieldProps {
  name?: string;
  id?: string;
  hintText?: string;
  value: string;
  errorText?: string;
  onChange: (event: any, r: string) => void;
  onBlur?: () => void;
  onKeyUp?: (event: any) => void;
  editorType?: React.ComponentClass<any>;
}

interface ReceiverFieldState {
  receivers: any[];
}

export class ReceiverField extends React.Component<
  ReceiverFieldProps,
  ReceiverFieldState
> {
  private inputStream = new Bacon.Bus<string>();
  private unsub: any[] = [];
  public state: ReceiverFieldState = { receivers: [] };

  public componentDidMount() {
    this.unsub.push(
      this.inputStream.onValue(v => this.props.onChange(null, v))
    );
    this.unsub.push(
      this.inputStream
        .filter(v => (v && v.length > 2 && v.length < 10) || false)
        .debounceImmediate(500)
        .flatMapLatest(v => Bacon.fromPromise(apiConnect.queryReceivers(v)))
        .onValue(v => this.setState({ receivers: v }))
    );
    this.unsub.push(
      this.inputStream
        .filter(v => !v || v.length < 3)
        .onValue(() => this.setState({ receivers: [] }))
    );
  }

  public componentWillUnmount() {
    this.inputStream.end();
    unsubscribeAll(this.unsub);
  }

  public render() {
    const type = this.props.editorType ? this.props.editorType : AutoComplete;
    return React.createElement(type, {
      name: this.props.name,
      id: this.props.id,
      dataSource: this.state.receivers,
      onUpdateInput: (r: string) => this.inputStream.push(r),
      placeholder: this.props.hintText || 'Kauppa',
      label: 'Saaja',
      fullWidth: true,
      error: Boolean(this.props.errorText),
      helpText: this.props.errorText,
      searchText: this.props.value,
      onBlur: this.props.onBlur,
      onKeyUp: this.props.onKeyUp,
    });
  }
}

export class PlainReceiverField extends React.Component<ReceiverFieldProps> {
  public render() {
    return (
      <ReceiverField
        {...this.props}
        value={this.props.value || ''}
        editorType={PlainAutoComplete}
      >
        {this.props.children}
      </ReceiverField>
    );
  }
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
