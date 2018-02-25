import * as React from 'react';
import styled from 'styled-components';
import * as colors from '../../Colors';
import UserAvatar from '../../component/UserAvatar';
import IconButton from 'material-ui/IconButton';
import { expenseName } from './../ExpenseHelper';
import { Repeat } from '../../Icons';
import apiConnect from '../../../data/ApiConnect';
import Money, { MoneyLike } from '../../../../shared/util/Money';
import { RecurringExpensePeriod, ExpenseDivisionItem, UserExpense } from '../../../../shared/types/Expense';
import { Map } from '../../../../shared/util/Objects';
import { User, Source } from '../../../../shared/types/Session';
import { confirm, notify, notifyError, updateExpenses } from '../../../data/State';
import { LoadingIndicator, Row, AllColumns } from '../ExpenseTableLayout';
import { toDate } from '../../../../shared/util/Time';
import BasicData from './BasicData';

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

interface ExpenseInfoProps {
  division: ExpenseDivisionItem[];
  loading: boolean;
  expense: UserExpense;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  user: User;
  source: Source;
  fullCategoryName: string;
}

export default class ExpenseInfo extends React.Component<ExpenseInfoProps, {}> {

  public render() {
    if (this.props.loading) {
      return <LoadingIndicator forRow={true} />;
    }
    const division = this.props.division;
    const expense = this.props.expense;
    const isIncome = expense.type === 'income';
    const users: Map<Map<MoneyLike>> = {};
    division.forEach(d => { users[d.userId] = { ...users[d.userId], [d.type]: d.sum }; });
    return (
      <Row>
        <AllColumns>
          <ExpenseInfoContainer>
            <BasicData {...this.props} />
            {this.props.expense.description ? <Description>{this.props.expense.description}</Description> : null}
            <div className="expense-recurrence">
              {this.props.expense.recurringExpenseId ? 'Tämä on toistuva tapahtuma' : <IconButton onClick={this.createRecurring}><Repeat /></IconButton>}
            </div>
            {this.renderUserHeaderRow(isIncome)}
            {Object.keys(users).map(userId => this.renderUser(userId, isIncome, users))}
          </ExpenseInfoContainer>
        </AllColumns>
      </Row>
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
          ],
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

const ExpenseInfoContainer = styled.div`
  min-height: 60pt;
  padding-top: 8px;
`;

const Description = styled.div`
  padding: 0 2em;
  white-space: pre-wrap;
`;
