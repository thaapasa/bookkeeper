import { Button, Checkbox, Group, Menu, Modal, Stack } from '@mantine/core';
import * as React from 'react';

import { ExpenseInEditor, UserExpenseWithDetails } from 'shared/expense';
import { ISODate } from 'shared/time';
import { MaybePromise } from 'shared/util';
import { useExpenseDialogData } from 'client/data/SessionStore';
import { CategorySelector } from 'client/ui/component/CategorySelector';
import { UserIdAvatar } from 'client/ui/component/UserAvatar';
import { UserSelector } from 'client/ui/component/UserSelector';
import { Icons } from 'client/ui/icons/Icons';
import { stopEventPropagation } from 'client/util/ClientUtil';

import { DivisionInfo } from '../details/DivisionInfo';
import { DateField } from './DateField';
import {
  DescriptionField,
  ExpenseDialogContent,
  SourceSelector,
  SumField,
  TypeSelector,
} from './ExpenseDialogComponents';
import { ExpenseDialogData } from './ExpenseDialogSessionData';
import { ExpenseSaveAction } from './ExpenseSaveAction';
import { GroupingSelector } from './GroupingSelector';
import { ReceiverField } from './ReceiverField';
import { TitleField } from './TitleField';
import { useExpenseDialog } from './useExpenseDialog';

export interface ExpenseDialogProps<D> {
  createNew: boolean;
  original: UserExpenseWithDetails | null;
  saveAction: ExpenseSaveAction | null;
  onClose: (e: D | null) => MaybePromise<void>;
  onExpensesUpdated: (date: ISODate) => void;
  expenseCounter: number;
  isMobile: boolean;
  values: Partial<D>;
  title?: string;
}

export type FullExpenseDialogProps<D> = ExpenseDialogProps<D> & ExpenseDialogData;

const inputAreaHeight = 60;

export const ExpenseDialog: React.FC<ExpenseDialogProps<ExpenseInEditor>> = outerProps => {
  const data = useExpenseDialogData()!;
  const props = { ...outerProps, ...data };
  const {
    state,
    setField,
    requestSave,
    dismiss,
    setToday,
    selectCategory,
    closeEditors,
    setUserId,
    sourceTitle,
    receiverTitle,
  } = useExpenseDialog(props);

  const typeAndConfirm = (
    <>
      <TypeSelector value={state.type} onChange={v => setField('type', v)} />
      <Checkbox
        checked={!state.confirmed}
        onChange={e => setField('confirmed', !e.currentTarget.checked)}
        label="Alustava"
        mx={4} // align checkbox square with the action icon below; picked by eye
      />
    </>
  );
  return (
    <Modal
      opened={true}
      onClose={dismiss}
      closeOnEscape={false}
      title={props.title ?? (props.createNew ? 'Uusi kirjaus' : 'Muokkaa kirjausta')}
      size="lg"
      fullScreen={props.isMobile}
    >
      <ExpenseDialogContent dividers={true} onClick={closeEditors} pb="md" pt="sm">
        <Stack component="form" gap="md" onSubmit={requestSave}>
          {/* Sum, type, owner */}
          <Group
            pos="relative"
            wrap="nowrap"
            align="flex-start"
            h={props.isMobile ? 68 : inputAreaHeight}
          >
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <UserIdAvatar mt={20} userId={state.userId} />
              </Menu.Target>
              <Menu.Dropdown>
                {props.users.map(u => (
                  <Menu.Item
                    key={u.id}
                    leftSection={<UserIdAvatar userId={u.id} />}
                    onClick={() => setUserId(u.id)}
                  >
                    {u.firstName}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <SumField
              value={state.sum}
              errorText={state.errors.sum}
              onChange={v => setField('sum', v)}
            />
            {props.isMobile ? (
              <Stack ml="auto" align="flex-start" gap="xs">
                {typeAndConfirm}
              </Stack>
            ) : (
              <Group ml="auto" wrap="nowrap" align="center" gap="sm" mt={26}>
                {typeAndConfirm}
              </Group>
            )}
          </Group>

          {/* Title */}
          <Group h={inputAreaHeight} align="flex-start">
            <TitleField
              id="expense-dialog-title"
              value={state.title}
              onSelect={selectCategory}
              errorText={state.errors.title}
              onChange={v => setField('title', v)}
            />
          </Group>

          {/* Receiver */}
          <Group h={inputAreaHeight} align="flex-start">
            <ReceiverField
              id="expense-dialog-receiver"
              fullWidth={true}
              value={state.receiver}
              onChange={v => setField('receiver', v)}
              errorText={state.errors.receiver}
              onKeyUp={stopEventPropagation}
              title={receiverTitle}
            />
          </Group>

          {/* Category */}
          <CategorySelector
            value={state.categoryId}
            onChange={v => setField('categoryId', v)}
            error={state.errors.categoryId}
          />

          {/* Source + benefitors */}
          <Group wrap="nowrap" h={inputAreaHeight} gap="lg" align="flex-start">
            <SourceSelector
              value={state.sourceId}
              sources={props.sources}
              flex={1}
              title={sourceTitle}
              onChange={v => setField('sourceId', v)}
            />
            <UserSelector pt={22} selected={state.benefit} onChange={v => setField('benefit', v)} />
          </Group>

          {/* Division preview */}
          {state.division ? (
            <DivisionInfo expenseType={state.type} division={state.division} />
          ) : null}

          {/* Date */}
          <Group align="flex-end">
            <DateField value={state.date} onChange={v => setField('date', v)} w={100} />
            <Button variant="filled" color="gray" leftSection={<Icons.Today />} onClick={setToday}>
              Tänään
            </Button>
          </Group>

          {/* Description */}
          <DescriptionField
            value={state.description}
            onChange={v => setField('description', v)}
            errorText={state.errors.description}
          />

          {/* Grouping */}
          <GroupingSelector
            value={state.groupingId}
            groupings={props.groupings}
            title="Ryhmittely"
            onChange={v => setField('groupingId', v)}
          />
        </Stack>
      </ExpenseDialogContent>
      <Group justify="flex-end" gap="sm" pt="md">
        <Button variant="subtle" onClick={dismiss}>
          Peruuta
        </Button>
        <Button variant="filled" disabled={!state.valid} onClick={requestSave}>
          Tallenna
        </Button>
      </Group>
    </Modal>
  );
};
