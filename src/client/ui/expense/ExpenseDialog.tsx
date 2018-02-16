import * as React from 'react';
import * as B from 'baconjs';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import UserSelector from '../component/UserSelector';
import Checkbox from 'material-ui/Checkbox';
import UserAvatar from '../component/UserAvatar';
import Money, { MoneyLike } from '../../../shared/util/Money';
import * as apiConnect from '../../data/ApiConnect';
import { KeyCodes } from '../../util/Io';
import { SumField, TypeSelector, TitleField, CategorySelector, SourceSelector, DateField, ReceiverField, DescriptionField } from './ExpenseDialogComponents';
import { expenseName } from './ExpenseHelper';
import { unsubscribeAll, stopEventPropagation } from '../../util/ClientUtil';
import { splitByShares, negateDivision, HasShares, HasSum } from '../../../shared/util/Splitter';
import { Category, Source, CategoryData, Group, User } from '../../../shared/types/Session';
import { UserExpenseWithDetails, ExpenseDivisionType, ExpenseInEditor, ExpenseData } from '../../../shared/types/Expense';
import { toDate, formatDate } from '../../../shared/util/Time';
import { Map, noop } from '../../../shared/util/Util';
import { connect } from '../component/BaconConnect';
import { validSessionE, sourceMapE } from '../../data/Login';
import { categoryDataSourceP, categoryMapE, isSubcategoryOf } from '../../data/Categories';
import { notify, notifyError, expenseDialogE, updateExpenses } from '../../data/State';
import { sortAndCompareElements, valuesToArray } from '../../../shared/util/Arrays';
import { ExpenseDialogObject } from '../../data/StateTypes';
import { omit } from '../../../shared/util/Objects';
const debug = require('debug')('bookkeeper:expense-dialog');

type CategoryInfo = Pick<Category, 'name' | 'id'>;

function errorIf(condition: boolean, error: string): string | undefined {
  return condition ? error : undefined;
}

const fields: ReadonlyArray<keyof ExpenseInEditor> = ['title', 'sourceId', 'categoryId', 'subcategoryId',
  'receiver', 'sum', 'userId', 'date', 'benefit', 'description', 'confirmed', 'type'];

const parsers: Map<(v: string) => any> = {
  sum: v => v.replace(/,/, '.'),
};

const validators: Map<(v: string) => any> = {
  title: v => errorIf(v.length < 1, 'Nimi puuttuu'),
  sourceId: v => errorIf(!v, 'Lähde puuttuu'),
  categoryId: v => errorIf(!v, 'Kategoria puuttuu'),
  receiver: v => errorIf(v.length < 1, 'Kohde puuttuu'),
  sum: v => errorIf(v.length === 0, 'Summa puuttuu') || errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, 'Summa on virheellinen'),
  benefit: v => errorIf(v.length < 1, 'Jonkun pitää hyötyä'),
};

// const defaultCategory: CategoryInfo[] = [{ id: 0, name: 'Kategoria' }];
const defaultSubcategory: CategoryInfo[] = [{ id: 0, name: 'Alikategoria' }];

function allTrue(...args: boolean[]): boolean {
  return args.reduce((a, b) => a && b, true);
}

function fixItem(type: ExpenseDivisionType) {
  return (item: any) => {
    item.sum = item.sum.toString();
    item.type = type;
    return item;
  };
}

interface ExpenseDialogProps {
  createNew: boolean;
  original: UserExpenseWithDetails | null;
  sources: Source[];
  categories: Category[];
  sourceMap: Map<Source>;
  categorySource: CategoryData[];
  categoryMap: Map<Category>;
  onClose: (e: ExpenseInEditor | null) => void;
  onExpensesUpdated: (date: Date) => void;
  group: Group;
  user: User;
}

interface ExpenseDialogState extends ExpenseInEditor {
  subcategories: CategoryInfo[];
  errors: Map<string | undefined>;
  valid: boolean;
}

export class ExpenseDialog extends React.Component<ExpenseDialogProps, ExpenseDialogState> {

  private saveLock: B.Bus<any, boolean>;
  private inputStreams: Map<B.Bus<any, any>> = {};
  private submitStream: B.Bus<any, true>;
  private unsub: any[] = [];
  public state = this.getDefaultState(null);

  private getDefaultSourceId(): number | undefined {
    return this.props.group.defaultSourceId!;
  }

  private getDefaultSourceUsers(): number[] {
    const sId = this.getDefaultSourceId();
    const source = sId && this.props.sourceMap[sId];
    return source && source.users.map(u => u.userId) || [this.props.user.id];
  }

  private findParentCategory(categoryId: number): number | undefined {
    const map = this.props.categoryMap;
    let current = map[categoryId];
    while (current && current.parentId && current.parentId > 0) {
      current = map[current.parentId];
    }
    return current ? current.id : undefined;
  }

  private getDefaultState(original: UserExpenseWithDetails | null): ExpenseDialogState {
    const e = original;
    return {
      title: e ? e.title : '',
      sourceId: e ? e.sourceId : this.getDefaultSourceId() || 0,
      categoryId: e && this.findParentCategory(e.categoryId) || 0,
      subcategoryId: e ? e.categoryId : 0,
      receiver: e ? e.receiver : '',
      sum: e ? e.sum.toString() : '',
      userId: e ? e.userId : this.props.user.id,
      date: e ? toDate(e.date) : new Date(),
      benefit: e ? e.division.filter(d => d.type === (e.type === 'expense' ? 'benefit' : 'split')).map(d => d.userId) : this.getDefaultSourceUsers(),
      description: e && e.description || '',
      confirmed: e ? e.confirmed : true,
      type: e ? e.type : 'expense',
      subcategories: [],
      errors: {},
      valid: false,
    };
  }

  private calculateCost(sum: MoneyLike, sourceId: number, benefit: Array<HasShares & HasSum>) {
    const sourceUsers = this.props.sourceMap[sourceId].users;
    const sourceUserIds = sourceUsers.map(s => s.userId);
    const benefitUserIds = benefit.map(b => b.userId);
    if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
      // Create cost based on benefit calculation
      debug('Source has same users than who benefit; creating benefit based on cost');
      return negateDivision(benefit);
    } else {
      // Calculate cost manually
      debug('Calculating cost by source users');
      return negateDivision(splitByShares(sum, sourceUsers));
    }
  }

  private calculateDivision(expense: ExpenseInEditor, sum: MoneyLike) {
    if (expense.type === 'expense') {
      const benefit = splitByShares(sum, expense.benefit.map(id => ({ userId: id, share: 1 })));
      const cost = this.calculateCost(sum, expense.sourceId, benefit);
      return benefit.map(fixItem('benefit')).concat(cost.map(fixItem('cost')));
    } else {
      const income = [{ userId: expense.userId, sum }];
      const split = negateDivision(splitByShares(sum, expense.benefit.map(id => ({ userId: id, share: 1 }))));
      return income.map(fixItem('income')).concat(split.map(fixItem('split')));
    }
  }

  public componentDidMount() {
    this.saveLock = new B.Bus<any, boolean>();
    this.inputStreams = {};
    this.submitStream = new B.Bus<any, true>();
    this.unsub.push(this.submitStream);
    fields.forEach(k => {
      this.inputStreams[k] = new B.Bus<any, any>();
      this.unsub.push(this.inputStreams[k]);
    });

    const validity: Map<B.Property<any, boolean>> = {};
    const values: Map<B.EventStream<any, any>> = {};
    fields.forEach(k => {
      this.inputStreams[k].onValue(v => this.setState({ [k]: v } as any));
      const parsed = parsers[k] ? this.inputStreams[k].map(parsers[k]) : this.inputStreams[k];
      values[k] = parsed;
      const error: B.Property<any, string | undefined> = validators[k] ? parsed.toProperty().map(validators[k]) : B.constant(undefined);
      error.onValue(e => this.setState(s => ({ errors: { ...s.errors, [k]: e }})));
      const isValid = error.map(v => v === undefined);
      validity[k] = isValid;
    });
    values.categoryId.onValue(id => {
      this.setState({ subcategories: defaultSubcategory.concat(id ? this.props.categoryMap[id].children || [] : []) });
    });
    B.combineAsArray(values.categoryId, values.subcategoryId).onValue(([id, subId]) => {
      if (subId > 0 && !isSubcategoryOf(subId, id, this.props.categoryMap)) { this.inputStreams.subcategoryId.push(0); }
    });
    values.sourceId.onValue(v => this.inputStreams.benefit.push(this.props.sourceMap[v].users.map(u => u.userId)));

    const allValid = B.combineWith(allTrue, valuesToArray(validity) as any);
    allValid.onValue(valid => this.setState({ valid }));
    const expense = B.combineTemplate(values);

    B.combineWith((e, v, h) => ({ ...e, allValid: v && !h }), expense, allValid, this.saveLock.toProperty(false))
      .sampledBy(this.submitStream)
      .filter(e => e.allValid)
      .onValue(e => this.saveExpense(e));

    this.pushExpenseToInputStreams(this.props.original);
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  private pushExpenseToInputStreams(expense: UserExpenseWithDetails | null) {
    const newState = this.getDefaultState(expense);
    debug('Start editing', newState);
    fields.map(k => this.inputStreams[k].push(newState[k]));
  }

  public componentWillReceiveProps(nextProps: ExpenseDialogProps) {
    debug('Settings props for', nextProps.original);
    this.pushExpenseToInputStreams(nextProps.original);
  }

  private requestSave = (event: React.SyntheticEvent<any>) => {
    this.submitStream.push(true);
    event.preventDefault();
    event.stopPropagation();
  }

  private saveExpense = async (expense: ExpenseInEditor) => {
    const createNew = !this.props.original;
    debug(createNew ? 'Create new expense' : 'save expense', expense);
    const sum = Money.from(expense.sum);
    const division = this.calculateDivision(expense, sum);
    const data: ExpenseData = {
      ...omit(['subcategoryId', 'benefit'], expense),
      division,
      date: formatDate(expense.date),
      categoryId: expense.subcategoryId ? expense.subcategoryId : expense.categoryId,
    };

    const name = expenseName(data);
    this.saveLock.push(true);
    try {
      if (this.props.original) {
        await apiConnect.updateExpense(this.props.original.id, data);
      } else {
        await apiConnect.storeExpense(data);
      }
      notify(`${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`);
      this.props.onExpensesUpdated(expense.date);
      this.props.onClose(expense);
    } catch (error) {
      notifyError(`Virhe ${createNew ? 'tallennettaessa' : 'päivitettäessä'} kirjausta ${name}`, error);
    }
    this.saveLock.push(false);
    return null;
  }

  private selectCategory = (id: number) => {
    const m = this.props.categoryMap;
    const name = m[id].name;
    if (m[id].parentId) {
      this.setCategory(m[id].parentId!, id);
    } else {
      this.setCategory(id, 0);
    }
    this.inputStreams.title.push(name);
  }

  private setCategory = (id: number, subcategoryId: number) => {
    this.inputStreams.categoryId.push(id);
    this.inputStreams.subcategoryId.push(subcategoryId);
  }

  private handleKeyPress = (event: React.KeyboardEvent<any>) => {
    const code = event.keyCode;
    if (code === KeyCodes.escape) {
      return this.dismiss();
    }
  }

  private dismiss = () => {
    return this.props.onClose(null);
  }

  // tslint:disable jsx-no-lambda
  public render() {
    const actions = [(
      <FlatButton
        label="Peruuta"
        primary={true}
        onClick={this.dismiss} />
    ), (
      <FlatButton
        label="Tallenna"
        primary={true}
        disabled={!this.state.valid}
        keyboardFocused={true}
        onClick={this.requestSave} />
    )];

    return (
      <Dialog
        contentClassName="expense-dialog"
        bodyClassName="expense-dialog-body"
        title={this.props.createNew ? 'Uusi kirjaus' : 'Muokkaa kirjausta'}
        actions={actions}
        modal={true}
        autoDetectWindowHeight={true}
        autoScrollBodyContent={true}
        open={true}
        onRequestClose={this.dismiss}>
        <form onSubmit={this.requestSave} onKeyUp={this.handleKeyPress}>
          <div>
            <UserAvatar userId={this.state.userId} style={{ verticalAlign: 'middle' }} />
            <div className="expense-sum" style={{ height: '72px', marginLeft: '2em', display: 'inline-block', verticalAlign: 'middle' }}>
              <SumField value={this.state.sum} errorText={this.state.errors.sum}
                onChange={v => this.inputStreams.sum.push(v)} />
            </div>
            <div className="expense-confirmed" style={{ marginLeft: '2em', display: 'inline-block', verticalAlign: 'middle' }}>
              <Checkbox label="Alustava" checked={!this.state.confirmed} onCheck={(e, v) => this.inputStreams.confirmed.push(!v)} />
            </div>
            <div className="expense-type" style={{ marginLeft: '2em', display: 'inline-block', verticalAlign: 'middle' }}>
              <TypeSelector value={this.state.type} onChange={v => this.inputStreams.type.push(v)} />
            </div>
          </div>
          <TitleField
            value={this.state.title}
            onSelect={this.selectCategory}
            dataSource={this.props.categorySource}
            errorText={this.state.errors.title}
            onChange={v => this.inputStreams.title.push(v)}
          />
          <ReceiverField value={this.state.receiver} onChange={(e, v) => this.inputStreams.receiver.push(v)}
            errorText={this.state.errors.receiver} onKeyUp={stopEventPropagation} />
          <CategorySelector
            category={this.state.categoryId} categories={this.props.categories}
            onChangeCategory={v => this.inputStreams.categoryId.push(v)}
            errorText={this.state.errors.categoryId}
            subcategory={this.state.subcategoryId} subcategories={this.state.subcategories}
            onChangeSubcategory={v => this.inputStreams.subcategoryId.push(v)} />
          <br />
          <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
            <SourceSelector
              value={this.state.sourceId} sources={this.props.sources} style={{ flexGrow: 1 }}
              onChange={v => this.inputStreams.sourceId.push(v)} />
            <UserSelector style={{ paddingTop: '0.5em' }} selected={this.state.benefit}
              onChange={v => this.inputStreams.benefit.push(v)} />
          </div>
          <br />

          <DateField value={this.state.date} onChange={v => this.inputStreams.date.push(v)} />
          <DescriptionField value={this.state.description} onChange={v => this.inputStreams.description.push(v)}
            errorText={this.state.errors.description} />
        </form>
      </Dialog>
    );
  }
}

interface BProps {
  sources: Source[];
  categories: Category[];
  sourceMap: Map<Source>;
  categorySource: CategoryData[];
  categoryMap: Map<Category>;
  group: Group;
  user: User;
}

const ConnectedExpenseDialog = connect(B.combineTemplate({
  sources: validSessionE.map(s => s.sources),
  categories: validSessionE.map(s => s.categories),
  user: validSessionE.map(s => s.user),
  group: validSessionE.map(s => s.group),
  sourceMap: sourceMapE,
  categorySource: categoryDataSourceP,
  categoryMap: categoryMapE,
}) as B.Property<any, BProps>)(ExpenseDialog);

interface ExpenseDialogListenerState {
  open: boolean;
  original: UserExpenseWithDetails | null;
  resolve: (e: ExpenseInEditor | null) => void;
}

export default class ExpenseDialogListener extends React.Component<{}, ExpenseDialogListenerState> {

  private unsub: any[] = [];

  public state: ExpenseDialogListenerState = {
    open: false,
    original: null,
    resolve: noop,
  };

  public componentDidMount() {
    this.unsub.push(expenseDialogE.onValue(e => this.handleOpen(e)));
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
    this.unsub = [];
  }

  private onExpensesUpdated = (date: Date) => {
    updateExpenses(date);
  }

  private handleOpen = async (data: ExpenseDialogObject) => {
    if (data.expenseId) {
      debug('Edit expense', data.expenseId);
      this.setState({ open: false, original: null });
      const original = await apiConnect.getExpense(data.expenseId);
      this.setState({ open: true, original, resolve: data.resolve });
    } else {
      debug('Create new expense');
      this.setState({ open: true, original: null, resolve: data.resolve });
    }
  }

  private closeDialog = (e: ExpenseInEditor | null) => {
    debug('Closing dialog');
    this.state.resolve(e);
    this.setState({ open: false, original: null });
    return false;
  }

  public render() {
    return this.state.open ?
      <ConnectedExpenseDialog {...this.state} onExpensesUpdated={this.onExpensesUpdated} createNew={!this.state.original} onClose={this.closeDialog} /> :
      null;
  }
}
