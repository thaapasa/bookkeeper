import * as React from 'react';
import * as categories from '../../data/Categories';
import * as state from '../../data/State';
import * as apiConnect from '../../data/ApiConnect';
import UserAvatar from '../component/UserAvatar';
import ActivatableTextField from '../component/ActivatableTextField';
import { PlainTextField } from '../component/PlainTextField';
import { ExpandLess, ExpandMore, Delete, Edit, Repeat, ToolIcon } from '../Icons'
import * as colors from '../Colors';
import { PlainReceiverField } from './ExpenseDialogComponents';
import { combineClassNames } from '../../util/ClientUtil';
import * as arrays from '../../../shared/util/Arrays';
import * as time from '../../../shared/util/Time';
import ExpenseDivision from './ExpenseDivision'
import { expenseName, money, ExpenseFilterFunction } from './ExpenseHelper';
import Money, { MoneyLike } from '../../../shared/util/Money';
import * as moment from 'moment';
import { Expense, UserExpense, UserExpenseWithDetails } from '../../../shared/types/Expense';

const emptyDivision = [];

interface ExpenseRowProps {
  expense: UserExpense,
  onUpdated: (expense: UserExpense) => void,
  addFilter: (filter: ExpenseFilterFunction, name: string, avater?: string) => void,
}

interface ExpenseRowState {
  details: UserExpenseWithDetails | null;
  isLoading: boolean;
};

export default class ExpenseRow extends React.Component<ExpenseRowProps, ExpenseRowState> {
  public state: ExpenseRowState = {
    details: null,
    isLoading: false,
  };

  private categoryLink(id: number) {
    const cat = categories.get(id);
    return (
      <a key={cat.id} onClick={
        () => this.props.addFilter(e => e.categoryId === cat.id || categories.get(e.categoryId).parentId === cat.id, categories.getFullName(cat.id))
      } style={{ color: colors.action }}>{cat.name}</a>
    );
  }

  private fullCategoryLink(id: number) {
    const cat = categories.get(id);
    return cat.parentId ?
      [this.categoryLink(cat.parentId), ' - ', this.categoryLink(id)] :
      this.categoryLink(id);
  }

  private getSource(sourceId) {
    const source = state.get('sourceMap')[sourceId];
    const content = source.image ?
      <img src={source.image} title={source.name} style={{ maxWidth: '48px', maxHeight: '24px' }} /> :
      (source.abbreviation ? source.abbreviation : source.name);
    const avatar = source.image ? source.image : undefined;
    return (
      <a key={source.id} onClick={
        () => this.props.addFilter(e => e.sourceId === sourceId, source.name, avatar)}>{content}</a>
    );
  }

  private updateExpense = async (data: Partial<UserExpense>) => {
    const exp = await apiConnect.getExpense(this.props.expense.id);
    const newData: UserExpense = { ...exp, ...data };
    await apiConnect.updateExpense(this.props.expense.id, newData);
    this.props.onUpdated(newData);
  }

  private editDate = async (expense: UserExpense) => {
    try {
      const date = await state.pickDate(moment(expense.date).toDate());
      this.updateExpense({ date: time.date(date) });
      return true;
    } catch (e) {
      state.notifyError('Virhe muutettaessa päivämäärää', e);
    }
  }

  private toggleDetails = async (expense: UserExpense, currentDetails: UserExpenseWithDetails | null) => {
    if (currentDetails) {
      this.setState({ details: null, isLoading: false });
    } else {
      this.setState({ isLoading: true });
      try {
        const details = await apiConnect.getExpense(expense.id);
        this.setState({ details, isLoading: false });
      }
      catch (error) {
        state.notifyError('Ei voitu ladata tietoja kirjaukselle', error);
        this.setState({ details: null, isLoading: false });
      };
    }
  }

  private deleteExpense = async (e: Expense) => {
    try {
      const name = expenseName(e);
      const b = await state.confirm('Poista kirjaus', `Haluatko varmasti poistaa kirjauksen ${name}?`, { okText: 'Poista' });
      if (!b) { return; }
      await apiConnect.deleteExpense(e.id);
      state.notify(`Poistettu kirjaus ${name}`);
      await state.updateExpenses(e.date);
    } catch (e) {
      state.notifyError(`Virhe poistettaessa kirjausta ${name}`, e);
    }
  }

  private modifyExpense = async (expense: UserExpense) => {
    const e = await apiConnect.getExpense(expense.id);
    state.editExpense(e);
  }

  public render() {
    const expense = this.props.expense;
    const className = 'bk-table-row expense-row expense-item ' + expense.type + (expense.confirmed ? '' : ' unconfirmed');
    const style = {
      background: !expense.confirmed ? colors.unconfirmedStripes :
        (expense.type === 'income' ? colors.income : undefined),
    };
    if (!expense.confirmed) {
      style.background = colors.unconfirmedStripes;
    } else if (expense.type === 'income') {
      style.background = colors.income;
    }
    return <div>
      <div key={expense.id} className={className} style={style}>
        <div className="expense-detail date" onClick={() => this.editDate(expense)}>{moment(expense.date).format("D.M.")}</div>
        <div className="expense-detail user optional">
          <UserAvatar userId={expense.userId} size={25} onClick={
            () => this.props.addFilter(
              e => e.userId === expense.userId,
              state.get("userMap")[expense.userId].firstName,
              state.get("userMap")[expense.userId].image)
          } />
        </div>
        <div className="expense-detail title" style={{ whiteSpace: "nowrap" }}>
          {expense.recurringExpenseId ?
            <div style={{ display: "inline-block", width: "14pt", verticalAlign: "top" }}><Repeat style={{ width: "12pt", height: "12pt", position: "absolute" }} /></div> : ''}
          <ActivatableTextField
            editorType={PlainTextField}
            name="title" value={expense.title}
            style={{ display: "inline-block", verticalAlign: "middle" }}
            onChange={v => this.updateExpense({ title: v })}
          />
        </div>
        <div className="expense-detail receiver optional"><ActivatableTextField
          name="receiver" value={expense.receiver}
          editorType={PlainReceiverField}
          onChange={v => this.updateExpense({ receiver: v })}
        /></div>
        <div className="expense-detail category optional">{this.fullCategoryLink(expense.categoryId)}</div>
        <div className="expense-detail source optional">{this.getSource(expense.sourceId)}</div>
        <div className="expense-detail sum">{Money.from(expense.sum).format()}</div>
        <div className="expense-detail balance optional" style={{ color: colors.forMoney(expense.userBalance) }} onClick={
          () => Money.zero.equals(expense.userBalance) ?
            this.props.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
            this.props.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
        }>{Money.from(expense.userBalance).format()}</div>
        <div className="expense-detail tools">
          <ToolIcon title="Tiedot" onClick={() => this.toggleDetails(expense, this.state.details)} icon={this.state.details ? ExpandLess : ExpandMore} />
          <ToolIcon title="Muokkaa" onClick={() => this.modifyExpense(expense)} icon={Edit} />
          <ToolIcon className="optional" title="Poista" onClick={() => this.deleteExpense(expense)} icon={Delete} />
        </div>
      </div>
      {this.renderDetails()}
    </div>
  }
  
  private renderDetails() {
    if (!this.state.isLoading && !this.state.details) { return null; }
    return (
      <ExpenseDivision
        loading={this.state.isLoading}
        key={'expense-division-' + this.props.expense.id}
        expense={this.props.expense}
        onDelete={this.deleteExpense}
        onModify={this.modifyExpense}
        division={this.state.details ? this.state.details.division : emptyDivision} />
    );
  }
}
