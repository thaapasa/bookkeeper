import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import debug from 'debug';
import UserSelector from '../../component/UserSelector';
import UserAvatar from '../../component/UserAvatar';
import Money, { MoneyLike } from 'shared/util/Money';
import apiConnect from '../../../data/ApiConnect';
import { KeyCodes } from '../../../util/Io';
import {
  SumField,
  TypeSelector,
  SourceSelector,
  DescriptionField,
} from './ExpenseDialogComponents';
import { expenseName } from '../ExpenseHelper';
import {
  unsubscribeAll,
  stopEventPropagation,
  eventValue,
} from 'client/util/ClientUtil';
import {
  splitByShares,
  negateDivision,
  HasShares,
  HasSum,
} from 'shared/util/Splitter';
import { Category, Source, Group, User } from 'shared/types/Session';
import {
  UserExpenseWithDetails,
  ExpenseDivisionType,
  ExpenseInEditor,
  ExpenseData,
  RecurringExpenseTarget,
  expenseBeneficiary,
  ExpenseDivision,
} from 'shared/types/Expense';
import { toDate, toISODate } from 'shared/util/Time';
import { identity } from 'shared/util/Util';
import { isSubcategoryOf, CategoryDataSource } from 'client/data/Categories';
import { notify, notifyError, confirm } from 'client/data/State';
import { sortAndCompareElements, valuesToArray } from 'shared/util/Arrays';
import { omit } from 'shared/util/Objects';
import { TitleField } from './TitleField';
import { ReceiverField } from './ReceiverField';
import { CategorySelector } from './CategorySelector';
import { DateField } from './DateField';
import { isMobileSize } from '../../Styles';
import { Size } from '../../Types';
import { gray } from 'client/ui/Colors';

const log = debug('bookkeeper:expense-dialog');

type CategoryInfo = Pick<Category, 'name' | 'id'>;

function errorIf(condition: boolean, error: string): string | undefined {
  return condition ? error : undefined;
}

const fields: ReadonlyArray<keyof ExpenseInEditor> = [
  'title',
  'sourceId',
  'categoryId',
  'subcategoryId',
  'receiver',
  'sum',
  'userId',
  'date',
  'benefit',
  'description',
  'confirmed',
  'type',
  'userId',
];

const parsers: Record<string, (v: string) => any> = {
  sum: v => v.replace(/,/, '.'),
};

const validators: Record<string, (v: string) => any> = {
  title: v => errorIf(v.length < 1, 'Nimi puuttuu'),
  sourceId: v => errorIf(!v, 'Lähde puuttuu'),
  categoryId: v => errorIf(!v, 'Kategoria puuttuu'),
  receiver: v => errorIf(v.length < 1, 'Kohde puuttuu'),
  sum: v =>
    errorIf(v.length === 0, 'Summa puuttuu') ||
    errorIf(
      v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null,
      'Summa on virheellinen'
    ),
  benefit: v => errorIf(v.length < 1, 'Jonkun pitää hyötyä'),
  userId: v => errorIf(!v, 'Omistaja puuttuu'),
};

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
  sourceMap: Record<string, Source>;
  categorySource: CategoryDataSource[];
  categoryMap: Record<string, Category>;
  onClose: (e: ExpenseInEditor | null) => void;
  onExpensesUpdated: (date: Date) => void;
  group: Group;
  user: User;
  users: User[];
  expenseCounter: number;
  windowSize: Size;
  values: Partial<ExpenseInEditor>;
}

interface ExpenseDialogState extends ExpenseInEditor {
  subcategories: CategoryInfo[];
  errors: Record<string, string | undefined>;
  valid: boolean;
  showOwnerSelect: boolean;
}

export class ExpenseDialog extends React.Component<
  ExpenseDialogProps,
  ExpenseDialogState
> {
  private readonly saveLock: B.Bus<boolean> = new B.Bus<boolean>();
  private inputStreams: Record<string, B.Bus<any>> = {};
  private readonly submitStream: B.Bus<true> = new B.Bus<true>();
  private unsub: any[] = [];
  public state = this.getDefaultState(null, {});

  get isMobile() {
    return isMobileSize(this.props.windowSize);
  }

  private getDefaultSourceId(): number | undefined {
    return this.props.group.defaultSourceId || undefined;
  }

  private getDefaultSourceUsers(): number[] {
    const sId = this.getDefaultSourceId();
    const source = sId && this.props.sourceMap[sId];
    return (source && source.users.map(u => u.userId)) || [this.props.user.id];
  }

  private findParentCategory(categoryId: number): number | undefined {
    const map = this.props.categoryMap;
    let current = map[categoryId];
    while (current && current.parentId && current.parentId > 0) {
      current = map[current.parentId];
    }
    return current ? current.id : undefined;
  }

  private getDefaultState(
    original: UserExpenseWithDetails | null,
    values: Partial<ExpenseInEditor>
  ): ExpenseDialogState {
    const e = original;
    return {
      title: values.title ? values.title : e ? e.title : '',
      sourceId:
        values.sourceId || (e ? e.sourceId : this.getDefaultSourceId()) || 0,
      categoryId:
        values.categoryId || (e && this.findParentCategory(e.categoryId)) || 0,
      subcategoryId: values.subcategoryId || (e ? e.categoryId : 0),
      receiver: values.receiver || (e ? e.receiver : ''),
      sum: values.sum ? values.sum : e ? e.sum.toString() : '',
      userId: e ? e.userId : this.props.user.id,
      date: values.date || (e ? toDate(e.date) : new Date()),
      benefit:
        values.benefit ||
        (e
          ? e.division
              .filter(d => d.type === expenseBeneficiary[e.type])
              .map(d => d.userId)
          : this.getDefaultSourceUsers()),
      description: values.description || (e && e.description) || '',
      confirmed:
        values.confirmed !== undefined
          ? values.confirmed
          : e
          ? e.confirmed
          : true,
      type: values.type || (e ? e.type : 'expense'),
      subcategories: [],
      errors: {},
      valid: false,
      showOwnerSelect: false,
    };
  }

  private calculateCost(
    sum: MoneyLike,
    sourceId: number,
    benefit: Array<HasShares & HasSum>
  ) {
    const sourceUsers = this.props.sourceMap[sourceId].users;
    const sourceUserIds = sourceUsers.map(s => s.userId);
    const benefitUserIds = benefit.map(b => b.userId);
    if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
      // Create cost based on benefit calculation
      log(
        'Source has same users than who benefit; creating benefit based on cost'
      );
      return negateDivision(benefit);
    } else {
      // Calculate cost manually
      log('Calculating cost by source users');
      return negateDivision(splitByShares(sum, sourceUsers));
    }
  }

  private calculateDivision(
    expense: ExpenseInEditor,
    sum: MoneyLike
  ): ExpenseDivision {
    switch (expense.type) {
      case 'expense': {
        const benefit = splitByShares(
          sum,
          expense.benefit.map(id => ({ userId: id, share: 1 }))
        );
        const cost = this.calculateCost(sum, expense.sourceId, benefit);
        return benefit
          .map(fixItem('benefit'))
          .concat(cost.map(fixItem('cost')));
      }
      case 'income': {
        const income = [{ userId: expense.userId, sum }];
        const split = negateDivision(
          splitByShares(
            sum,
            expense.benefit.map(id => ({ userId: id, share: 1 }))
          )
        );
        return income
          .map(fixItem('income'))
          .concat(split.map(fixItem('split')));
      }
      case 'transfer': {
        const transferee = splitByShares(
          sum,
          expense.benefit.map(id => ({ userId: id, share: 1 }))
        );
        const transferor = this.calculateCost(
          sum,
          expense.sourceId,
          transferee
        );
        return transferee
          .map(fixItem('transferee'))
          .concat(transferor.map(fixItem('transferor')));
      }
      default:
        throw new Error('Unknown expense type ' + expense.type);
    }
  }

  public componentDidMount() {
    this.inputStreams = {};
    this.unsub.push(this.submitStream);
    fields.forEach(k => {
      this.inputStreams[k] = new B.Bus<any>();
      this.unsub.push(this.inputStreams[k]);
    });

    const validity: Record<string, B.Property<boolean>> = {};
    const values: Record<string, B.EventStream<any>> = {};
    fields.forEach(k => {
      this.inputStreams[k].onValue(v => this.setState({ [k]: v } as any));
      const parsed = parsers[k]
        ? this.inputStreams[k].map(parsers[k])
        : this.inputStreams[k].map(identity);
      values[k] = parsed;
      const validator = validators[k];
      if (validator) {
        const error = parsed.map(v => validator(v));
        error.onValue(e =>
          this.setState(s => ({ errors: { ...s.errors, [k]: e } }))
        );
        const isValid = error.map(v => v === undefined).toProperty();
        validity[k] = isValid;
      } else {
        validity[k] = B.constant(true);
      }
    });
    values.categoryId.onValue(id => {
      this.setState({
        subcategories:
          (this.props.categoryMap[id] && this.props.categoryMap[id].children) ||
          [],
      });
    });
    B.combineAsArray(values.categoryId, values.subcategoryId).onValue(
      ([id, subId]) => {
        if (subId > 0 && !isSubcategoryOf(subId, id, this.props.categoryMap)) {
          this.inputStreams.subcategoryId.push(0);
        }
      }
    );
    values.sourceId.onValue(v =>
      this.inputStreams.benefit.push(
        this.props.sourceMap[v].users.map(u => u.userId)
      )
    );

    const allValid = B.combineWith(allTrue, valuesToArray(validity) as any);
    allValid.onValue(valid => this.setState({ valid }));
    const expense = B.combineTemplate(values);

    B.combineWith(
      (e, v, h) => ({ ...e, allValid: v && !h }),
      expense,
      allValid,
      this.saveLock.toProperty(false)
    )
      .sampledBy(this.submitStream)
      .filter(e => e.allValid)
      .onValue(e => this.saveExpense(e));

    this.pushExpenseToInputStreams(this.props.original, this.props.values);
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  private pushExpenseToInputStreams(
    expense: UserExpenseWithDetails | null,
    values: Partial<ExpenseInEditor>
  ) {
    const newState = this.getDefaultState(expense, values);
    log('Start editing', newState);
    fields.map(k => this.inputStreams[k].push(newState[k]));
  }

  public componentDidUpdate(prevProps: ExpenseDialogProps) {
    if (this.props.expenseCounter !== prevProps.expenseCounter) {
      log('Settings props for', this.props.original);
      this.pushExpenseToInputStreams(this.props.original, this.props.values);
    }
  }

  private requestSave = (event: React.SyntheticEvent<any>) => {
    this.submitStream.push(true);
    event.preventDefault();
    event.stopPropagation();
  };

  private saveExpense = async (expense: ExpenseInEditor) => {
    const createNew = !this.props.original;
    log(createNew ? 'Create new expense' : 'save expense', expense);
    const sum = Money.from(expense.sum);
    const division = this.calculateDivision(expense, sum);
    const data: ExpenseData = {
      ...omit(['subcategoryId', 'benefit'], expense),
      division,
      date: toISODate(expense.date),
      categoryId: expense.subcategoryId
        ? expense.subcategoryId
        : expense.categoryId,
    };

    const name = expenseName(data);
    this.saveLock.push(true);
    try {
      if (this.props.original) {
        if (this.props.original.recurringExpenseId) {
          if (!(await this.saveRecurring(this.props.original.id, data))) {
            // User canceled, break out
            return;
          }
        } else {
          await apiConnect.updateExpense(this.props.original.id, data);
        }
      } else {
        await apiConnect.storeExpense(data);
      }
      notify(`${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`);
      this.props.onExpensesUpdated(expense.date);
      this.props.onClose(expense);
    } catch (error) {
      notifyError(
        `Virhe ${
          createNew ? 'tallennettaessa' : 'päivitettäessä'
        } kirjausta ${name}`,
        error
      );
    } finally {
      this.saveLock.push(false);
    }
    return null;
  };

  private saveRecurring = async (
    originalId: number,
    data: ExpenseData
  ): Promise<boolean> => {
    const target = await confirm<RecurringExpenseTarget | null>(
      'Tallenna toistuva kirjaus',
      'Mitä kirjauksia haluat muuttaa?',
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
      return false;
    }
    await apiConnect.updateRecurringExpense(originalId, data, target);
    return true;
  };

  private selectCategory = (id: number) => {
    const m = this.props.categoryMap;
    const name = m[id].name;
    const parentId = m[id].parentId;
    if (parentId) {
      this.setCategory(parentId, id);
    } else {
      this.setCategory(id, 0);
    }
    this.inputStreams.title.push(name);
  };

  private setCategory = (id: number, subcategoryId: number) => {
    this.inputStreams.categoryId.push(id);
    this.inputStreams.subcategoryId.push(subcategoryId);
  };

  private handleKeyPress = (event: React.KeyboardEvent<any>) => {
    const code = event.keyCode;
    if (code === KeyCodes.escape) {
      return this.dismiss();
    }
  };

  private dismiss = () => {
    return this.props.onClose(null);
  };

  private closeEditors = () => {
    this.setState({ showOwnerSelect: false });
  };

  private openOwnerSelector = (
    _userId: number,
    event: React.MouseEvent<any>
  ) => {
    this.setState({ showOwnerSelect: true });
    event.stopPropagation();
    return false;
  };

  private setUserId = (userId: number, event: React.MouseEvent<any>) => {
    this.inputStreams.userId.push(userId);
    this.setState({ showOwnerSelect: false });
    event.stopPropagation();
    return false;
  };

  public render() {
    return (
      <Dialog
        open={true}
        onClose={this.dismiss}
        scroll="paper"
        fullScreen={this.isMobile}
      >
        <DialogTitle>
          {this.props.createNew ? 'Uusi kirjaus' : 'Muokkaa kirjausta'}
        </DialogTitle>
        <DialogContent
          className="expense-dialog-content vertical-scroll-area"
          dividers={true}
          onClick={this.closeEditors}
        >
          <Form onSubmit={this.requestSave} onKeyUp={this.handleKeyPress}>
            <Row className="row sum parent">
              <OwnerSelectorArea
                id="owner-selector-area"
                className={this.state.showOwnerSelect ? 'visible' : 'hidden'}
              >
                {this.props.users.map(u => (
                  <UserAvatar
                    key={u.id}
                    userId={u.id}
                    className={
                      u.id === this.state.userId ? 'selected' : 'unselected'
                    }
                    onClick={this.setUserId}
                  />
                ))}
              </OwnerSelectorArea>
              <UserAvatar
                userId={this.state.userId}
                style={{ verticalAlign: 'middle' }}
                onClick={this.openOwnerSelector}
              />
              <SumArea>
                <SumField
                  value={this.state.sum}
                  errorText={this.state.errors.sum}
                  onChange={v => this.inputStreams.sum.push(v)}
                />
              </SumArea>
              <ConfirmArea>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!this.state.confirmed}
                      onChange={e =>
                        this.inputStreams.confirmed.push(!e.target.checked)
                      }
                    />
                  }
                  label="Alustava"
                />
              </ConfirmArea>
              <TypeArea>
                <TypeSelector
                  value={this.state.type}
                  onChange={v => this.inputStreams.type.push(v)}
                />
              </TypeArea>
            </Row>
            <Row className="row input title">
              <TitleField
                id="expense-dialog-title"
                value={this.state.title}
                onSelect={this.selectCategory}
                dataSource={this.props.categorySource}
                errorText={this.state.errors.title}
                onChange={v => this.inputStreams.title.push(eventValue(v))}
              />
            </Row>
            <Row className="row input receiver">
              <ReceiverField
                id="expense-dialog-receiver"
                fullWidth={true}
                value={this.state.receiver}
                onChange={e => this.inputStreams.receiver.push(eventValue(e))}
                errorText={this.state.errors.receiver}
                onKeyUp={stopEventPropagation}
              />
            </Row>
            <Row className="row select category">
              <CategorySelector
                category={this.state.categoryId}
                categories={this.props.categories}
                onChangeCategory={v => this.inputStreams.categoryId.push(v)}
                errorText={this.state.errors.categoryId}
                subcategory={this.state.subcategoryId}
                subcategories={this.state.subcategories}
                onChangeSubcategory={v =>
                  this.inputStreams.subcategoryId.push(v)
                }
              />
            </Row>
            <Row className="row select source">
              <SourceSelector
                value={this.state.sourceId}
                sources={this.props.sources}
                style={{ flexGrow: 1 }}
                onChange={v => this.inputStreams.sourceId.push(v)}
              />
              <UserSelector
                selected={this.state.benefit}
                onChange={v => this.inputStreams.benefit.push(v)}
              />
            </Row>
            <Row className="row input date">
              <DateField
                value={this.state.date}
                onChange={v => this.inputStreams.date.push(v)}
              />
            </Row>
            <Row className="row input description">
              <DescriptionField
                value={this.state.description}
                onChange={v => this.inputStreams.description.push(v)}
                errorText={this.state.errors.description}
              />
            </Row>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button key="cancel" variant="text" onClick={this.dismiss}>
            Peruuta
          </Button>
          <Button
            key="save"
            variant="text"
            color="primary"
            disabled={!this.state.valid}
            onClick={this.requestSave}
          >
            Tallenna
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 80px;

  &.source {
    & > div:first-of-type {
      margin-right: 16px;
    }
  }

  &.parent {
    position: relative;
  }
`;

const OwnerSelectorArea = styled.div`
  position: absolute;
  top: 8px;
  left: -24px;
  padding: 12px 10px 12px 24px;
  border-radius: 4px;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  background-color: ${gray.light};
  display: flex;
  flex-direction: row;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.15);
  z-index: 1;

  & > div {
    margin-right: 8px;
  }

  &.visible {
    display: flex;
  }

  &.hidden {
    display: none;
  }
`;

const SumArea = styled.div`
  margin-left: 1em;
  display: inline-block;
  vertical-align: middle;
`;

const ConfirmArea = styled.div`
  margin-left: 1em;
  display: inline-block;
  vertical-align: middle;
`;

const TypeArea = styled.div`
  width: 92px;
  display: inline-block;
  vertical-align: middle;
`;
