import * as React from 'react';
import * as colors from '../Colors';
import * as categories from '../../data/Categories';
import UserAvatar from '../component/UserAvatar';
import IconButton from 'material-ui/IconButton';
import { expenseName } from './ExpenseHelper';
import { Repeat } from '../Icons';
import * as apiConnect from '../../data/ApiConnect';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money, { MoneyLike } from '../../../shared/util/Money';
import { RecurringExpensePeriod, ExpenseDivisionItem, UserExpense } from '../../../shared/types/Expense';
import { Map } from '../../../shared/util/Util';
import { User, Source, Category } from '../../../shared/types/Session';
import { confirm, notify, notifyError, updateExpenses } from '../../data/State';
import { toDate } from 'shared/util/Time';

const styles = {
  tool: {
    margin: '0',
    padding: '0',
    width: 36,
    height: 36
  },
  toolIcon: {
    color: colors.tool,
    fontSize: '15pt'
  }
};

function divisionItem(sum: MoneyLike) {
  const s = Money.orZero(sum);
  return (
    <div className="expense-division-item">
      <div className="sum" style={{ color: colors.forMoney(s) }}>{s.format()}</div>
    </div>
  );
}

const divisionTypes = ['cost', 'benefit', 'income', 'split'];
function getBalance(data: Map<MoneyLike>) {
  return divisionTypes.map(t => Money.orZero(data[t])).reduce((a, b) => a.plus(b), Money.zero).negate();
}


function DetailRow(props: { name: string, value: string }) {
  return (
    <div className="expense-detail-mobile">
      <span className="detail-label">{props.name + ":"}</span>
      {props.value}
    </div>
  );
}


interface ExpenseDivisionProps {
  division: ExpenseDivisionItem[];
  loading: boolean;
  expense: UserExpense;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  user: User;
  source: Source;
  fullCategoryName: string;
};

export default class ExpenseDivision extends React.Component<ExpenseDivisionProps, {}> {

  public render() {
    if (this.props.loading) { return this.renderLoading(); }
    const division = this.props.division;
    const expense = this.props.expense;
    const isIncome = expense.type === 'income';
    const user = this.props.user;
    const users: Map<Map<MoneyLike>> = {};
    division.forEach(d => { users[d.userId] = { ...users[d.userId], [d.type]: d.sum }});
    return (
      <div className="expense-division">
        {this.renderDetails(user, expense)}
        {this.props.expense.description ? <div className="expense-description">{this.props.expense.description}</div> : null}
        <div className="expense-recurrence">
          {this.props.expense.recurringExpenseId ? 'Tämä on toistuva tapahtuma' : <IconButton onClick={this.createRecurring}><Repeat /></IconButton>}
        </div>
        {this.renderUserHeaderRow(isIncome)}
        {Object.keys(users).map(userId => this.renderUser(userId, isIncome, users))}
      </div>
    );
  }

  private renderLoading() {
    return (
      <div className="expense-division">
        <div className="details-loading-indicator"><RefreshIndicator left={-20} top={20} status="loading" size={40} /></div>
      </div>
    );
  }

  private renderDetails(user: User, expense: UserExpense) {
    return (
      <div className="mobile">
        <div className="expense-details">
          <DetailRow name="Kirjaaja" value={user.firstName} />
          <DetailRow name="Kohde" value={expense.receiver} />
          <DetailRow name="Kategoria" value={this.props.fullCategoryName} />
          <DetailRow name="Lähde" value={this.props.source.name} />
        </div>
        <div className="tools-mobile">
          <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
            onClick={() => this.props.onModify(expense)}>edit</IconButton>
          <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
            onClick={() => this.props.onDelete(expense)}>delete</IconButton>
        </div>
      </div>
    );
  }

  private renderUserHeaderRow(isIncome: boolean) {
    return (
      <div key="header" className="expense-user">
        <div className="avatar-placeholder">Jako:</div>
        <div className="expense-division-item"><div className="label">{isIncome ? 'Tulo' : 'Kulu'}</div></div>
        <div className="expense-division-item"><div className="label">{isIncome ? 'Jako' : 'Hyöty'}</div></div>
        <div className="expense-division-item"><div className="label">Balanssi</div></div>
      </div>
    ); 
  }

  private renderUser(userId: string, isIncome: boolean, users: Map<Map<MoneyLike>>) {
    return (
      <div key={userId} className="expense-user">
        <UserAvatar userId={parseInt(userId, 10)} size={25} style={{ verticalAlign: 'middle' }} />
        {divisionItem(isIncome ? users[userId].income : users[userId].cost)}
        {divisionItem(isIncome ? users[userId].split : users[userId].benefit)}
        {divisionItem(getBalance(users[userId]))}
      </div>
    );
  }
  
  private createRecurring = async () => {
    try {
      const period = await confirm<RecurringExpensePeriod | undefined>('Muuta toistuvaksi',
        `Kuinka usein kirjaus ${expenseName(this.props.expense)} toistuu?`, {
          actions: [
            { label: 'Kuukausittain', value: 'monthly'  },
            { label: 'Vuosittain', value: 'yearly' },
            { label: 'Peruuta', value: undefined },
          ]
        });
      if (period) {
        await apiConnect.createRecurring(this.props.expense.id, period);
        await updateExpenses(toDate(this.props.expense.date));
        notify('Kirjaus muutettu toistuvaksi');
      }
    } catch (e) {
      notifyError('Virhe muutettaessa kirjausta toistuvaksi', e);
    }
  }

}
