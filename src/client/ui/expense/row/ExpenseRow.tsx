import { styled } from '@mui/material';
import debug from 'debug';
import * as React from 'react';

import { ExpenseDivisionItem, RecurringExpenseTarget, UserExpense, UserExpenseWithDetails } from 'shared/expense';
import { readableDate, toDate, toISODate, toMoment } from 'shared/time';
import { Category, CategoryMap, isDefined, Source, User } from 'shared/types';
import { equal, Money, notEqual } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { getFullCategoryName, UserDataProps } from 'client/data/Categories';
import { editExpense, needUpdateE, notifyError, updateExpenses } from 'client/data/State';
import * as colors from 'client/ui/Colors';
import { ActivatableTextField } from 'client/ui/component/ActivatableTextField';
import { ExpanderIcon } from 'client/ui/component/ExpanderIcon';
import { UserAvatar } from 'client/ui/component/UserAvatar';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { ToolIcon } from 'client/ui/icons/ToolIcon';
import { Flex, media, VCenterRow } from 'client/ui/Styles';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpenseInfo } from '../details/ExpenseInfo';
import { ReceiverField } from '../dialog/ReceiverField';
import { expenseName } from '../ExpenseHelper';
import { ExpenseFilterFunction, ExpenseFilters } from './ExpenseFilters';
import { SourceIcon, TextButton } from './ExpenseRowComponents';
import {
  AvatarColumn,
  BalanceColumn,
  CategoryColumn,
  DateColumn,
  NameColumn,
  ReceiverColumn,
  RecurringExpenseIcon,
  Row,
  SourceColumn,
  SumColumn,
  ToolColumn,
  UnconfirmedIcon,
} from './ExpenseTableLayout';
import { styled } from '@mui/material';

const log = debug('bookkeeper:expense-row');

const emptyDivision: ExpenseDivisionItem[] = [];

export interface CommonExpenseRowProps {
  expense: UserExpense;
  prev?: UserExpense | null;
  onUpdated: (expense: UserExpense) => void;
  selectCategory?: (categorey: Category) => void;
  addFilter: (filter: ExpenseFilterFunction, name: string, avater?: string) => void;
}

interface ExpenseRowProps extends CommonExpenseRowProps {
  user: User;
  source: Source;
  fullCategoryName: string;
  categoryMap: CategoryMap;
  userMap: Record<string, User>;
  dateBorder?: boolean;
}

interface ExpenseRowState {
  details: UserExpenseWithDetails | null;
  isLoading: boolean;
}

export class ExpenseRowImpl extends React.Component<ExpenseRowProps, ExpenseRowState> {
  public state: ExpenseRowState = {
    details: null,
    isLoading: false,
  };

  private onClickCategory = (cat: Category) => {
    if (this.props.selectCategory) {
      this.props.selectCategory(cat);
    }
    this.props.addFilter(
      e => e.categoryId === cat.id || this.props.categoryMap[e.categoryId].parentId === cat.id,
      getFullCategoryName(cat.id, this.props.categoryMap),
    );
  };

  private categoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return (
      <TextButton key={cat.id} onClick={() => this.onClickCategory(cat)} style={{ color: colors.action }}>
        {cat.name}
      </TextButton>
    );
  }

  private fullCategoryLink(id: number) {
    const cat = this.props.categoryMap[id];
    return cat.parentId ? [this.categoryLink(cat.parentId), ' - ', this.categoryLink(id)] : this.categoryLink(id);
  }

  private updateExpense = async (data: Partial<UserExpense>) => {
    log('Updating expense with data', data);
    const exp = await apiConnect.getExpense(this.props.expense.id);
    const newData: UserExpense = { ...exp, ...data };
    await apiConnect.updateExpense(this.props.expense.id, newData);
    this.props.onUpdated(newData);
  };

  private editDate = async () => {
    const date = await UserPrompts.selectDate('Valitse päivä', toMoment(this.props.expense.date));
    if (!date) return;
    await executeOperation(() => this.updateExpense({ date: toISODate(date) }), {
      success: `Muutettu kirjauksen ${this.props.expense.title} päiväksi ${readableDate(date)}`,
      postProcess: () => needUpdateE.push(date),
    });
  };

  private toggleDetails = async (expense: UserExpense, currentDetails: UserExpenseWithDetails | null) => {
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
    const name = expenseName(e);
    if (e.recurringExpenseId) {
      return this.deleteRecurringExpense();
    }

    await executeOperation(() => apiConnect.deleteExpense(e.id), {
      confirmTitle: 'Poista kirjaus',
      confirm: `Haluatko varmasti poistaa kirjauksen ${name}?`,
      success: `Poistettu kirjaus ${name}`,
      postProcess: () => updateExpenses(toDate(e.date)),
    });
  };

  private deleteRecurringExpense = async () => {
    const e = this.props.expense;

    const name = expenseName(e);
    const target = await UserPrompts.select<RecurringExpenseTarget>(
      'Poista toistuva kirjaus',
      `Haluatko varmasti poistaa kirjauksen ${name}?`,
      [
        { label: 'Vain tämä', value: 'single' },
        { label: 'Kaikki', value: 'all' },
        { label: 'Tästä eteenpäin', value: 'after' },
      ],
    );
    if (!target) return;

    await executeOperation(() => apiConnect.deleteRecurringById(e.id, target), {
      success: `Poistettu kirjaus ${name}`,
      postProcess: () => updateExpenses(toDate(e.date)),
    });
  };

  private modifyExpense = async () => {
    const e = await apiConnect.getExpense(this.props.expense.id);
    await editExpense(e.id);
  };

  public render() {
    const expense = this.props.expense;
    const source = this.props.source;
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
    const firstDay = !this.props.prev || !toMoment(expense.date).isSame(this.props.prev.date, 'day');
    return (
      <>
        <Row className={firstDay && this.props.dateBorder ? 'first-day' : ''}>
          <DateColumn onClick={this.editDate}>
            {expense.recurringExpenseId ? <RecurringExpenseIcon /> : null}
            <DateContainer>
              <WeekDay>{weekDay(expense.date, this.props.prev)}</WeekDay>
              {readableDate(expense.date)}
            </DateContainer>
          </DateColumn>
          <AvatarColumn>
            <UserAvatar
              user={this.props.userMap[expense.userId]}
              size={32}
              onClick={() =>
                this.props.addFilter(e => e.userId === expense.userId, this.props.user.firstName, this.props.user.image)
              }
            />
          </AvatarColumn>
          <NameColumn>
            {this.props.expense.confirmed ? null : (
              <UnconfirmedIcon onClick={() => this.props.addFilter(ExpenseFilters.unconfirmed, 'Alustavat')} />
            )}
            <ActivatableTextField
              fullWidth
              value={expense.title}
              viewStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
              onChange={v => this.updateExpense({ title: v })}
            />
          </NameColumn>
          <ReceiverColumn>
            <ActivatableTextField
              fullWidth
              value={expense.receiver}
              editorType={ReceiverField}
              onChange={v => this.updateExpense({ receiver: v })}
            />
          </ReceiverColumn>
          <CategoryColumn>{this.fullCategoryLink(expense.categoryId)}</CategoryColumn>
          <SourceColumn>
            <SourceIcon
              source={source}
              onClick={() =>
                this.props.addFilter(
                  e => e.sourceId === source.id,
                  source.name,
                  source.image ? source.image : undefined,
                )
              }
            />
          </SourceColumn>
          <SumColumn className={expense.type}>
            <VCenterRow className="fill">
              <ExpenseTypeIcon type={expense.type} color={colors.colorScheme.secondary.dark} size={20} />
              <Flex />
              <div>{Money.from(expense.sum).format()}</div>
            </VCenterRow>
          </SumColumn>
          <BalanceColumn
            style={{ color: colors.forMoney(expense.userBalance) }}
            onClick={() =>
              Money.zero.equals(expense.userBalance)
                ? this.props.addFilter(ExpenseFilters.zeroBalance, `Balanssi ${equal} 0`)
                : this.props.addFilter(ExpenseFilters.nonZeroBalance, `Balanssi ${notEqual} 0`)
            }
          >
            {Money.from(expense.userBalance).format()}
          </BalanceColumn>
          <ToolColumn>
            <ExpanderIcon
              title="Tiedot"
              open={isDefined(this.state.details)}
              onToggle={() => this.toggleDetails(expense, this.state.details)}
            />
            <OptionalIcons>
              <ToolIcon title="Muokkaa" onClick={this.modifyExpense} icon="Edit" />
              <ToolIcon className="optional" title="Poista" onClick={this.deleteExpense} icon="Delete" />
            </OptionalIcons>
          </ToolColumn>
        </Row>
        {this.renderDetails()}
      </>
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
        division={this.state.details ? this.state.details.division : emptyDivision}
        user={this.props.user}
        source={this.props.source}
        fullCategoryName={this.props.fullCategoryName}
      />
    );
  }
}

export const ExpenseRow: React.FC<CommonExpenseRowProps & { userData: UserDataProps }> = props => (
  <ExpenseRowImpl
    {...props}
    categoryMap={props.userData.categoryMap}
    userMap={props.userData.userMap}
    user={props.userData.userMap[props.expense.userId]}
    source={props.userData.sourceMap[props.expense.sourceId]}
    fullCategoryName={getFullCategoryName(props.expense.categoryId, props.userData.categoryMap)}
  />
);

function weekDay(date: string, prev?: UserExpense | null) {
  const m = toMoment(date);
  return !prev || !m.isSame(prev.date, 'day') ? m.format('dd') : null;
}

const DateContainer = styled('div')`
  position: relative;
  z-index: 1;
`;

const OptionalIcons = styled('div')`
  display: inline-block;
  ${media.mobile`
    display: none;
  `}
`;

const WeekDay = styled('span')`
  padding-right: 4px;
  font-weight: bold;
  ${media.mobile`
    display: none;
  `}
`;
