import * as React from 'react';
import * as B from 'baconjs';
import * as apiConnect from '../../data/ApiConnect';
import UserAvatar from '../component/UserAvatar';
import ActivatableTextField from '../component/ActivatableTextField';
import { PlainTextField } from '../component/PlainTextField';
import { ExpandLess, ExpandMore, Delete, Edit, Repeat, ToolIcon } from '../Icons'
import * as colors from '../Colors';
import { PlainReceiverField } from './ExpenseDialogComponents';
import ExpenseDivision from './ExpenseDivision'
import { expenseName,  ExpenseFilterFunction } from './ExpenseHelper';
import Money from '../../../shared/util/Money';
import moment from 'moment';
import { Expense, UserExpense, UserExpenseWithDetails, ExpenseDivisionItem } from '../../../shared/types/Expense';
import { User, Source, Category } from '../../../shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userMapE, sourceMapE } from '../../data/Login';
import { pickDate, notifyError, notify, confirm, updateExpenses, editExpense } from '../../data/State';
import { categoryMapE, getFullCategoryName } from '../../data/Categories';
import { Map } from 'shared/util/Util';
import { toDate, formatDate } from 'shared/util/Time';

const emptyDivision: ExpenseDivisionItem[] = [];

interface CommonExpenseRowProps {
  expense: UserExpense;
  onUpdated: (expense: UserExpense) => void;
  addFilter: (filter: ExpenseFilterFunction, name: string, avater?: string) => void;
}

interface ExpenseRowProps extends CommonExpenseRowProps {
  user: User;
  source: Source;
  fullCategoryName: string;
  categoryMap: Map<Category>
}

interface ExpenseRowState {
  details: UserExpenseWithDetails | null;
  isLoading: boolean;
};

export class ExpenseRow extends React.Component<ExpenseRowProps, ExpenseRowState> {
  public state: ExpenseRowState = {
    details: null,
    isLoading: false,
  };

  private categoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return (
      <a key={cat.id} onClick={
        () => this.props.addFilter(e => e.categoryId === cat.id || this.props.categoryMap[e.categoryId].parentId === cat.id, getFullCategoryName(cat.id, this.props.categoryMap))
      } style={{ color: colors.action }}>{cat.name}</a>
    );
  }

  private fullCategoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return cat.parentId ?
      [this.categoryLink(cat.parentId), ' - ', this.categoryLink(id)] :
      this.categoryLink(id);
  }

  private getSource() {
    const source = this.props.source;
    const content = source.image ?
      <img src={source.image} title={source.name} style={{ maxWidth: '48px', maxHeight: '24px' }} /> :
      (source.abbreviation ? source.abbreviation : source.name);
    const avatar = source.image ? source.image : undefined;
    return (
      <a key={source.id} onClick={
        () => this.props.addFilter(e => e.sourceId === source.id, source.name, avatar)}>{content}</a>
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
      const date = await pickDate(moment(expense.date).toDate());
      this.updateExpense({ date: formatDate(date) });
      return true;
    } catch (e) {
      notifyError('Virhe muutettaessa päivämäärää', e);
      return false;
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
        notifyError('Ei voitu ladata tietoja kirjaukselle', error);
        this.setState({ details: null, isLoading: false });
      };
    }
  }

  private deleteExpense = async (e: Expense) => {
    try {
      const name = expenseName(e);
      const b = await confirm<boolean>('Poista kirjaus', `Haluatko varmasti poistaa kirjauksen ${name}?`, { okText: 'Poista' });
      if (!b) { return; }
      await apiConnect.deleteExpense(e.id);
      notify(`Poistettu kirjaus ${name}`);
      await updateExpenses(toDate(e.date));
    } catch (e) {
      notifyError(`Virhe poistettaessa kirjausta ${name}`, e);
    }
  }

  private modifyExpense = async (expense: UserExpense) => {
    const e = await apiConnect.getExpense(expense.id);
    editExpense(e.id);
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
              this.props.user.firstName,
              this.props.user.image)
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
        <div className="expense-detail source optional">{this.getSource()}</div>
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
        division={this.state.details ? this.state.details.division : emptyDivision}
        user={this.props.user}
        source={this.props.source}
        fullCategoryName={this.props.fullCategoryName} />
    );
  }
}

interface BProps {
  sourceMap: Map<Source>;
  userMap: Map<User>;
  categoryMap: Map<Category>;
};

class ExpenseRowMapper extends React.Component<CommonExpenseRowProps & BProps, {}> {
  public render() {
    return (
      <ExpenseRow {...this.props}
        user={this.props.userMap[this.props.expense.userId]}
        source={this.props.sourceMap[this.props.expense.sourceId]}
        fullCategoryName={getFullCategoryName(this.props.expense.categoryId, this.props.categoryMap)}
      />
    );
  }
}

export default connect(B.combineTemplate({ userMap: userMapE, sourceMap: sourceMapE, categoryMap: categoryMapE }) as B.Property<any, BProps>)(ExpenseRowMapper);
