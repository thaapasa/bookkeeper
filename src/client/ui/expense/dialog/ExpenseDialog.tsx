import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  FormControlLabel,
  styled,
} from '@mui/material';
import * as B from 'baconjs';
import { Dayjs } from 'dayjs';
import * as React from 'react';

import {
  expenseBeneficiary,
  ExpenseData,
  ExpenseDivision,
  ExpenseInEditor,
  ExpenseType,
  UserExpenseWithDetails,
} from 'shared/expense';
import { toDayjs, toISODate } from 'shared/time';
import { Category, CategoryMap, Group, Source, User } from 'shared/types';
import { identity, Money, omit, sanitizeMoneyInput, valuesToArray } from 'shared/util';
import { CategoryDataSource, isSubcategoryOf } from 'client/data/Categories';
import { logger } from 'client/Logger';
import { gray } from 'client/ui/Colors';
import UserAvatar from 'client/ui/component/UserAvatar';
import UserSelector from 'client/ui/component/UserSelector';
import { Icons } from 'client/ui/icons/Icons';
import { isMobileSize } from 'client/ui/Styles';
import { Size } from 'client/ui/Types';
import { eventValue, stopEventPropagation, unsubscribeAll } from 'client/util/ClientUtil';
import { KeyCodes } from 'client/util/Io';

import { DivisionInfo } from '../details/DivisionInfo';
import { CategorySelector } from './CategorySelector';
import { DateField } from './DateField';
import {
  DescriptionField,
  ExpenseDialogContent,
  SourceSelector,
  SumField,
  TypeSelector,
} from './ExpenseDialogComponents';
import { calculateDivision } from './ExpenseDialogData';
import { defaultExpenseSaveAction, ExpenseSaveAction } from './ExpenseSaveAction';
import { ReceiverField } from './ReceiverField';
import { TitleField } from './TitleField';

type CategoryInfo = Pick<Category, 'name' | 'id'>;

function errorIf(condition: boolean, error: string): string | undefined {
  return condition ? error : undefined;
}

const SourceTitles: Record<ExpenseType, string> = {
  expense: 'Lähde',
  income: 'Kohde',
  transfer: 'Maksaja',
};

const ReceiverTitles: Record<ExpenseType, string> = {
  expense: 'Kohde',
  income: 'Maksaja',
  transfer: 'Saaja',
};

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
  sum: sanitizeMoneyInput,
};

const validators: Record<string, (v: string) => any> = {
  title: v => errorIf(v.length < 1, 'Nimi puuttuu'),
  sourceId: v => errorIf(!v, 'Lähde puuttuu'),
  categoryId: v => errorIf(!v, 'Kategoria puuttuu'),
  receiver: v => errorIf(v.length < 1, 'Kohde puuttuu'),
  sum: v =>
    errorIf(v.length === 0, 'Summa puuttuu') ||
    errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, 'Summa on virheellinen'),
  benefit: v => errorIf(v.length < 1, 'Jonkun pitää hyötyä'),
  userId: v => errorIf(!v, 'Omistaja puuttuu'),
};

function allTrue(...args: boolean[]): boolean {
  return args.reduce((a, b) => a && b, true);
}

export interface ExpenseDialogProps<D> {
  createNew: boolean;
  original: UserExpenseWithDetails | null;
  sources: Source[];
  categories: Category[];
  sourceMap: Record<string, Source>;
  categorySource: CategoryDataSource[];
  categoryMap: CategoryMap;
  saveAction: ExpenseSaveAction | null;
  onClose: (e: D | null) => void;
  onExpensesUpdated: (date: Dayjs) => void;
  group: Group;
  user: User;
  users: User[];
  expenseCounter: number;
  windowSize: Size;
  values: Partial<D>;
}

interface ExpenseDialogState extends ExpenseInEditor {
  subcategories: CategoryInfo[];
  errors: Record<string, string | undefined>;
  valid: boolean;
  showOwnerSelect: boolean;
  division: ExpenseDivision | null;
}

export class ExpenseDialog extends React.Component<
  ExpenseDialogProps<ExpenseInEditor>,
  ExpenseDialogState
> {
  private readonly saveLock: B.Bus<boolean> = new B.Bus<boolean>();
  private inputStreams: Record<string, B.Bus<any>> = {};
  private readonly submitStream: B.Bus<true> = new B.Bus<true>();
  private unsub: any[] = [];
  public state = this.getDefaultState(null, {});

  get isMobile(): boolean {
    return isMobileSize(this.props.windowSize);
  }

  get sourceTitle(): string {
    return SourceTitles[this.state.type] ?? 'Lähde';
  }

  get receiverTitle(): string {
    return ReceiverTitles[this.state.type] ?? 'Kohde';
  }

  private getDefaultSourceId(): number | undefined {
    return this.props.group.defaultSourceId || undefined;
  }

  private getDefaultSourceUsers(): number[] {
    const sId = this.getDefaultSourceId();
    const source = sId ? this.props.sourceMap[sId] : undefined;
    return source?.users.map(u => u.userId) || [this.props.user.id];
  }

  private findParentCategory(categoryId: number): number | undefined {
    const map = this.props.categoryMap;
    let current = map[categoryId];
    while (current?.parentId && current.parentId > 0) {
      current = map[current.parentId];
    }
    return current ? current.id : undefined;
  }

  private getDefaultState(
    original: UserExpenseWithDetails | null,
    values: Partial<ExpenseInEditor>,
  ): ExpenseDialogState {
    const e = original;
    return {
      title: values.title ? values.title : e ? e.title : '',
      sourceId: values.sourceId || (e ? e.sourceId : this.getDefaultSourceId()) || 0,
      categoryId: values.categoryId || (e && this.findParentCategory(e.categoryId)) || 0,
      subcategoryId: values.subcategoryId || (e ? e.categoryId : 0),
      receiver: values.receiver || (e ? e.receiver : ''),
      sum: values.sum ? values.sum : e ? e.sum.toString() : '',
      userId: e ? e.userId : this.props.user.id,
      date: toDayjs(values.date || e?.date),
      benefit:
        values.benefit ||
        (e
          ? e.division.filter(d => d.type === expenseBeneficiary[e.type]).map(d => d.userId)
          : this.getDefaultSourceUsers()),
      description: values.description || e?.description || '',
      confirmed: values.confirmed !== undefined ? values.confirmed : e ? e.confirmed : true,
      type: values.type || (e ? e.type : 'expense'),
      subcategories: [],
      errors: {},
      valid: false,
      showOwnerSelect: false,
      division: null,
    };
  }

  public componentDidMount() {
    this.inputStreams = {};
    this.unsub.push(this.submitStream);
    fields.forEach(k => {
      this.inputStreams[k] = new B.Bus<any>();
      this.unsub.push(this.inputStreams[k]);
    });

    const validity: Record<string, B.Property<boolean>> = {};
    const values: Record<keyof ExpenseInEditor, B.EventStream<any>> = {} as any;
    fields.forEach(k => {
      this.inputStreams[k].onValue(v => this.setState({ [k]: v } as any));
      const parsed = parsers[k]
        ? this.inputStreams[k].map(parsers[k])
        : this.inputStreams[k].map(identity);
      values[k] = parsed;
      const validator = validators[k];
      if (validator) {
        const error = parsed.map(v => validator(v));
        error.onValue(e => this.setState(s => ({ errors: { ...s.errors, [k]: e } })));
        const isValid = error.map(v => v === undefined).toProperty();
        validity[k] = isValid;
      } else {
        validity[k] = B.constant(true);
      }
    });
    values.categoryId.onValue(id => {
      this.setState({
        subcategories: this.props.categoryMap[id]?.children || [],
      });
    });
    B.combineAsArray(values.categoryId, values.subcategoryId).onValue(([id, subId]) => {
      if (subId > 0 && !isSubcategoryOf(subId, id, this.props.categoryMap)) {
        this.inputStreams.subcategoryId.push(0);
      }
    });
    values.sourceId.onValue(v =>
      this.inputStreams.benefit.push(this.props.sourceMap[v].users.map(u => u.userId)),
    );

    const allValid = B.combineWith(allTrue, valuesToArray(validity) as any);
    allValid.onValue(valid => this.setState({ valid }));
    const expense: B.Property<ExpenseInEditor> = B.combineTemplate(values);
    B.combineTemplate({ expense, allValid })
      .map(({ allValid, expense }) =>
        allValid
          ? calculateDivision(
              expense.type,
              expense.sum,
              expense.benefit,
              this.props.sourceMap[expense.sourceId],
            )
          : null,
      )
      .onValue(division => this.setState({ division }));

    B.combineWith(
      (e, v, h) => ({ ...e, allValid: v && !h }),
      expense,
      allValid,
      this.saveLock.toProperty(false),
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
    values: Partial<ExpenseInEditor>,
  ) {
    const newState = this.getDefaultState(expense, values);
    logger.info('Start editing %s', newState);
    fields.map(k => this.inputStreams[k].push(newState[k]));
  }

  public componentDidUpdate(prevProps: ExpenseDialogProps<ExpenseInEditor>) {
    if (this.props.expenseCounter !== prevProps.expenseCounter) {
      logger.debug('Settings props for %s', this.props.original);
      this.pushExpenseToInputStreams(this.props.original, this.props.values);
    }
  }

  private requestSave = (event: React.SyntheticEvent<any>) => {
    this.submitStream.push(true);
    event.preventDefault();
    event.stopPropagation();
  };

  private saveExpense = async (expense: ExpenseInEditor) => {
    const sum = Money.from(expense.sum);
    const division = calculateDivision(
      expense.type,
      sum,
      expense.benefit,
      this.props.sourceMap[expense.sourceId],
    );
    const data: ExpenseData = {
      ...omit(['subcategoryId', 'benefit'], expense),
      division,
      date: toISODate(expense.date),
      categoryId: expense.subcategoryId ? expense.subcategoryId : expense.categoryId,
    };

    this.saveLock.push(true);
    try {
      const r = await (this.props.saveAction ?? defaultExpenseSaveAction)(
        data,
        this.props.original,
      );
      if (r) {
        this.props.onExpensesUpdated(toDayjs(expense.date));
        this.props.onClose(expense);
      }
    } finally {
      this.saveLock.push(false);
    }
  };

  private setToday = () => this.inputStreams.date.push(toDayjs());

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

  private openOwnerSelector = (_userId: number, event: React.MouseEvent<any>) => {
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
      <Dialog open={true} onClose={this.dismiss} scroll="paper" fullScreen={this.isMobile}>
        <DialogTitle>{this.props.createNew ? 'Uusi kirjaus' : 'Muokkaa kirjausta'}</DialogTitle>
        <ExpenseDialogContent dividers={true} onClick={this.closeEditors}>
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
                    className={u.id === this.state.userId ? 'selected' : 'unselected'}
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
                      onChange={e => this.inputStreams.confirmed.push(!e.target.checked)}
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
                title={this.receiverTitle}
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
                onChangeSubcategory={v => this.inputStreams.subcategoryId.push(v)}
              />
            </Row>
            <Row className="row select source">
              <SourceSelector
                value={this.state.sourceId}
                sources={this.props.sources}
                style={{ flexGrow: 1 }}
                title={this.sourceTitle}
                onChange={v => this.inputStreams.sourceId.push(v)}
              />
              <UserSelector
                selected={this.state.benefit}
                onChange={v => this.inputStreams.benefit.push(v)}
              />
            </Row>
            {this.state.division ? (
              <Row className="row select division">
                <DivisionInfo expenseType={this.state.type} division={this.state.division} />
              </Row>
            ) : null}
            <Row className="row input date">
              <DateField value={this.state.date} onChange={v => this.inputStreams.date.push(v)} />
              <TodayButton
                title="Tänään"
                variant="contained"
                color="secondary"
                startIcon={<Icons.Today />}
                onClick={this.setToday}
              >
                Tänään
              </TodayButton>
            </Row>
            <Row className="row input description">
              <DescriptionField
                value={this.state.description}
                onChange={v => this.inputStreams.description.push(v)}
                errorText={this.state.errors.description}
              />
            </Row>
          </Form>
        </ExpenseDialogContent>
        <DialogActions>
          <Button key="cancel" variant="text" onClick={this.dismiss}>
            Peruuta
          </Button>
          <Button
            key="save"
            variant="contained"
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

const Form = styled('form')`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const Row = styled('div')`
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

  &.division {
    height: inherit;
  }

  &.date {
    justify-content: flex-start;
    align-items: flex-end;
  }
`;

const TodayButton = styled(Button)`
  margin-left: 16px;
  position: relative;
  top: 1px;
`;

const OwnerSelectorArea = styled('div')`
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

const SumArea = styled('div')`
  margin-left: 1em;
  display: inline-block;
  vertical-align: middle;
`;

const ConfirmArea = styled('div')`
  margin-left: 1em;
  display: inline-block;
  vertical-align: middle;
`;

const TypeArea = styled('div')`
  width: 92px;
  display: inline-block;
  vertical-align: middle;
`;
