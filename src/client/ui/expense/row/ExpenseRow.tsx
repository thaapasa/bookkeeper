import * as React from 'react';
import styled from 'styled-components';
import apiConnect from 'client/data/ApiConnect';
import { UserAvatar } from 'client/ui/component/UserAvatar';
import ActivatableTextField from 'client/ui/component/ActivatableTextField';
import {
  ExpandLess,
  ExpandMore,
  Delete,
  Edit,
  ToolIcon,
  ExpenseTypeIcon,
} from 'client/ui/Icons';
import { Flex, VCenterRow } from 'client/ui/Styles';
import * as colors from 'client/ui/Colors';
import { ExpenseInfo } from '../details/ExpenseInfo';
import { expenseName } from '../ExpenseHelper';
import Money from 'shared/util/Money';
import {
  UserExpense,
  UserExpenseWithDetails,
  ExpenseDivisionItem,
  RecurringExpenseTarget,
} from 'shared/types/Expense';
import { User, Source, Category } from 'shared/types/Session';
import {
  pickDate,
  notifyError,
  notify,
  confirm,
  updateExpenses,
  editExpense,
} from 'client/data/State';
import { getFullCategoryName, UserDataProps } from 'client/data/Categories';
import { toDate, toISODate, toMoment, readableDate } from 'shared/util/Time';
import { ExpenseFilterFunction } from './ExpenseFilterRow';
import { equal, notEqual } from 'shared/util/Symbols';
import {
  RecurringExpenseIcon,
  UnconfirmedIcon,
  DateColumn,
  AvatarColumn,
  NameColumn,
  ReceiverColumn,
  CategoryColumn,
  SourceColumn,
  SumColumn,
  BalanceColumn,
  ToolColumn,
  Row,
  sourceWidth,
} from './ExpenseTableLayout';
import { TextField } from '@material-ui/core';
import debug from 'debug';
import { ReceiverField } from '../dialog/ReceiverField';

const log = debug('bookkeeper:expense-row');

const emptyDivision: ExpenseDivisionItem[] = [];

const TextButton = styled.button`
  border: 0;
  font-size: 13px;
  outline: none;
  background: none;
  &:hover {
    text-decoration: underline;
  }
`;

interface CommonExpenseRowProps {
  expense: UserExpense;
  onUpdated: (expense: UserExpense) => void;
  selectCategory?: (categorey: Category) => void;
  addFilter: (
    filter: ExpenseFilterFunction,
    name: string,
    avater?: string
  ) => void;
}

interface ExpenseRowProps extends CommonExpenseRowProps {
  user: User;
  source: Source;
  fullCategoryName: string;
  categoryMap: Record<string, Category>;
  userMap: Record<string, User>;
}

interface ExpenseRowState {
  details: UserExpenseWithDetails | null;
  isLoading: boolean;
}

export class ExpenseRow extends React.Component<
  ExpenseRowProps,
  ExpenseRowState
> {
  public state: ExpenseRowState = {
    details: null,
    isLoading: false,
  };

  private onClickCategory = (cat: Category) => {
    if (this.props.selectCategory) {
      this.props.selectCategory(cat);
    }
    this.props.addFilter(
      e =>
        e.categoryId === cat.id ||
        this.props.categoryMap[e.categoryId].parentId === cat.id,
      getFullCategoryName(cat.id, this.props.categoryMap)
    );
  };

  private categoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return (
      <TextButton
        key={cat.id}
        onClick={() => this.onClickCategory(cat)}
        style={{ color: colors.action }}
      >
        {cat.name}
      </TextButton>
    );
  }

  private fullCategoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return cat.parentId
      ? [this.categoryLink(cat.parentId), ' - ', this.categoryLink(id)]
      : this.categoryLink(id);
  }

  private getSource() {
    const source = this.props.source;
    const content = source.image ? (
      <SourceImage src={source.image} title={source.name} />
    ) : source.abbreviation ? (
      source.abbreviation
    ) : (
      source.name
    );
    const avatar = source.image ? source.image : undefined;
    return (
      <TextButton
        key={source.id}
        onClick={() =>
          this.props.addFilter(
            e => e.sourceId === source.id,
            source.name,
            avatar
          )
        }
      >
        {content}
      </TextButton>
    );
  }

  private updateExpense = async (data: Partial<UserExpense>) => {
    log('Updating expense with data', data);
    const exp = await apiConnect.getExpense(this.props.expense.id);
    const newData: UserExpense = { ...exp, ...data };
    await apiConnect.updateExpense(this.props.expense.id, newData);
    this.props.onUpdated(newData);
  };

  private editDate = async () => {
    try {
      const date = await pickDate(toMoment(this.props.expense.date).toDate());
      notify(
        `Muutettu kirjauksen ${
          this.props.expense.title
        } päiväksi ${readableDate(date)}`
      );
      this.updateExpense({ date: toISODate(date) });
      return true;
    } catch (e) {
      notifyError('Virhe muutettaessa päivämäärää', e);
      return false;
    }
  };

  private toggleDetails = async (
    expense: UserExpense,
    currentDetails: UserExpenseWithDetails | null
  ) => {
    if (currentDetails) {
      this.setState({ details: null, isLoading: false });
    } else {
      this.setState({ isLoading: true });
      try {
        const details = await apiConnect.getExpense(expense.id);
        this.setState({ details, isLoading: false });
      } catch (error) {
        notifyError('Ei voitu ladata tietoja kirjaukselle', error);
        this.setState({ details: null, isLoading: false });
      }
    }
  };

  private deleteExpense = async () => {
    const e = this.props.expense;
    try {
      const name = expenseName(e);
      if (e.recurringExpenseId) {
        return this.deleteRecurringExpense();
      }
      const b = await confirm<boolean>(
        'Poista kirjaus',
        `Haluatko varmasti poistaa kirjauksen ${name}?`,
        { okText: 'Poista' }
      );
      if (!b) {
        return;
      }
      await apiConnect.deleteExpense(e.id);
      notify(`Poistettu kirjaus ${name}`);
      await updateExpenses(toDate(e.date));
    } catch (err) {
      notifyError(`Virhe poistettaessa kirjausta ${expenseName(e)}`, err);
    }
  };

  private deleteRecurringExpense = async () => {
    const e = this.props.expense;
    try {
      const name = expenseName(e);
      const target = await confirm<RecurringExpenseTarget | null>(
        'Poista toistuva kirjaus',
        `Haluatko varmasti poistaa kirjauksen ${name}?`,
        {
          actions: [
            { label: 'Vain tämä', value: 'single' },
            { label: 'Kaikki', value: 'all' },
            { label: 'Tästä eteenpäin', value: 'after' },
            { label: 'Peruuta', value: null },
          ],
        }
      );
      if (!target) {
        return;
      }
      await apiConnect.deleteRecurringById(e.id, target);
      notify(`Poistettu kirjaus ${name}`);
      await updateExpenses(toDate(e.date));
    } catch (err) {
      notifyError(
        `Virhe poistettaessa toistuvaa kirjausta ${expenseName(e)}`,
        err
      );
    }
  };

  private modifyExpense = async () => {
    const e = await apiConnect.getExpense(this.props.expense.id);
    editExpense(e.id);
  };

  public render() {
    const expense = this.props.expense;
    // const className = 'bk-table-row expense-row expense-item ' + expense.type + (expense.confirmed ? '' : ' unconfirmed');
    const style = {
      background: !expense.confirmed
        ? colors.unconfirmedStripes
        : expense.type === 'income'
        ? colors.income
        : undefined,
    };
    if (!expense.confirmed) {
      style.background = colors.unconfirmedStripes;
    } else if (expense.type === 'income') {
      style.background = colors.income;
    }
    return (
      <React.Fragment>
        <Row>
          <DateColumn onClick={this.editDate}>
            {expense.recurringExpenseId ? <RecurringExpenseIcon /> : null}
            <DateContainer>{readableDate(expense.date)}</DateContainer>
          </DateColumn>
          <AvatarColumn>
            <UserAvatar
              user={this.props.userMap[expense.userId]}
              size={32}
              onClick={() =>
                this.props.addFilter(
                  e => e.userId === expense.userId,
                  this.props.user.firstName,
                  this.props.user.image
                )
              }
            />
          </AvatarColumn>
          <NameColumn>
            {this.props.expense.confirmed ? null : <UnconfirmedIcon />}
            <ActivatableTextField
              editorId={`expense-row-name-${this.props.expense.id}`}
              editorType={TextField}
              value={expense.title}
              viewStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
              onChange={v => this.updateExpense({ title: v })}
            />
          </NameColumn>
          <ReceiverColumn>
            <ActivatableTextField
              editorId={`expense-row-receiver-${this.props.expense.id}`}
              value={expense.receiver}
              editorType={ReceiverField}
              onChange={v => this.updateExpense({ receiver: v })}
            />
          </ReceiverColumn>
          <CategoryColumn>
            {this.fullCategoryLink(expense.categoryId)}
          </CategoryColumn>
          <SourceColumn>{this.getSource()}</SourceColumn>
          <SumColumn className={expense.type}>
            <VCenterRow className="fill">
              <ExpenseTypeIcon
                type={expense.type}
                color={colors.colorScheme.secondary.dark}
                size={20}
              />
              <Flex />
              <div>{Money.from(expense.sum).format()}</div>
            </VCenterRow>
          </SumColumn>
          <BalanceColumn
            style={{ color: colors.forMoney(expense.userBalance) }}
            onClick={() =>
              Money.zero.equals(expense.userBalance)
                ? this.props.addFilter(
                    e => Money.zero.equals(e.userBalance),
                    `Balanssi ${equal} 0`
                  )
                : this.props.addFilter(
                    e => !Money.zero.equals(e.userBalance),
                    `Balanssi ${notEqual} 0`
                  )
            }
          >
            {Money.from(expense.userBalance).format()}
          </BalanceColumn>
          <ToolColumn>
            <ToolIcon
              title="Tiedot"
              onClick={() => this.toggleDetails(expense, this.state.details)}
              icon={this.state.details ? ExpandLess : ExpandMore}
            />
            <ToolIcon
              title="Muokkaa"
              onClick={this.modifyExpense}
              icon={Edit}
            />
            <ToolIcon
              className="optional"
              title="Poista"
              onClick={this.deleteExpense}
              icon={Delete}
            />
          </ToolColumn>
        </Row>
        {this.renderDetails()}
      </React.Fragment>
    );
  }

  private renderDetails() {
    if (!this.state.isLoading && !this.state.details) {
      return null;
    }
    return (
      <ExpenseInfo
        loading={this.state.isLoading}
        key={'expense-division-' + this.props.expense.id}
        expense={this.props.expense}
        onDelete={this.deleteExpense}
        onModify={this.modifyExpense}
        division={
          this.state.details ? this.state.details.division : emptyDivision
        }
        user={this.props.user}
        source={this.props.source}
        fullCategoryName={this.props.fullCategoryName}
      />
    );
  }
}

export default class ExpenseRowMapper extends React.Component<
  CommonExpenseRowProps & { userData: UserDataProps }
> {
  public render() {
    return (
      <ExpenseRow
        {...this.props}
        categoryMap={this.props.userData.categoryMap}
        userMap={this.props.userData.userMap}
        user={this.props.userData.userMap[this.props.expense.userId]}
        source={this.props.userData.sourceMap[this.props.expense.sourceId]}
        fullCategoryName={getFullCategoryName(
          this.props.expense.categoryId,
          this.props.userData.categoryMap
        )}
      />
    );
  }
}

const DateContainer = styled.div`
  position: relative;
  z-index: 1;
`;

const SourceImage = styled.img`
  max-width: ${sourceWidth}px;
  max-height: 34px;
`;
