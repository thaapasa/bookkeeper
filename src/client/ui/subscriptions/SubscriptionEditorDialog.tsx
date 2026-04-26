import {
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Tabs,
  Textarea,
  TextInput,
} from '@mantine/core';
import * as React from 'react';

import {
  ExpenseDefaults,
  ExpenseQuery,
  ExpenseType,
  expenseTypes,
  getExpenseTypeLabel,
  Subscription,
  SubscriptionUpdate,
} from 'shared/expense';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { useValidSession } from 'client/data/SessionStore';
import { executeOperation } from 'client/util/ExecuteOperation';

import { CategoryMultiSelector } from '../component/CategoryMultiSelector';
import { CategorySelector } from '../component/CategorySelector';
import { SourceSelector, SumField } from '../expense/dialog/ExpenseDialogComponents';

interface Props {
  item: Subscription;
  opened: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  filter: ExpenseQuery;
  defaults?: ExpenseDefaults;
}

const TRI_STATE_OPTIONS = [
  { value: 'any', label: 'Mikä tahansa' },
  { value: 'true', label: 'Vain valmiit' },
  { value: 'false', label: 'Vain alustavat' },
];

const TYPE_FILTER_OPTIONS = [
  { value: 'any', label: 'Kaikki tyypit' },
  ...expenseTypes.map(t => ({ value: t, label: getExpenseTypeLabel(t) })),
];

const TYPE_OPTIONS = expenseTypes.map(t => ({ value: t, label: getExpenseTypeLabel(t) }));

export const SubscriptionEditorDialog: React.FC<Props> = ({ item, opened, onClose }) => {
  const session = useValidSession();
  const hasRecurrence = !!item.recurrence;

  const [state, setState] = React.useState<FormState>(() => initialState(item));

  React.useEffect(() => {
    if (opened) setState(initialState(item));
  }, [opened, item]);

  const setTitle = (title: string) => setState(s => ({ ...s, title }));
  const updateFilter = (patch: Partial<ExpenseQuery>) =>
    setState(s => ({ ...s, filter: { ...s.filter, ...patch } }));
  const updateDefaults = (patch: Partial<ExpenseDefaults>) =>
    setState(s => (s.defaults ? { ...s, defaults: { ...s.defaults, ...patch } } : s));

  const titleValid = state.title.trim().length > 0;
  const defaultsValid = !state.defaults || state.defaults.title.trim().length > 0;
  const canSave = titleValid && defaultsValid;

  const save = async () => {
    const update: SubscriptionUpdate = {
      title: state.title.trim(),
      filter: stripBlanks(state.filter),
      ...(state.defaults ? { defaults: state.defaults } : {}),
    };
    await executeOperation(() => apiConnect.updateSubscription(item.rowId, update), {
      success: 'Tilaus päivitetty',
      postProcess: () => {
        invalidateSubscriptionData();
        onClose();
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Muokkaa tilausta" size="lg">
      <Tabs defaultValue="general" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="general">Yleiset</Tabs.Tab>
          <Tabs.Tab value="filter">Suodatin</Tabs.Tab>
          {hasRecurrence ? <Tabs.Tab value="defaults">Mallikulu</Tabs.Tab> : null}
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Stack gap="sm">
            <TextInput
              label="Tilauksen nimi"
              description="Näkyy tilauslistalla; ei vaikuta luotuihin kirjauksiin."
              value={state.title}
              onChange={e => setTitle(e.currentTarget.value)}
              error={titleValid ? undefined : 'Nimi ei voi olla tyhjä'}
              autoFocus
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="filter" pt="md">
          <FilterEditor
            filter={state.filter}
            onChange={updateFilter}
            users={session.users.map(u => ({ id: u.id, label: u.firstName }))}
          />
        </Tabs.Panel>

        {hasRecurrence ? (
          <Tabs.Panel value="defaults" pt="md">
            {state.defaults ? (
              <DefaultsEditor
                defaults={state.defaults}
                onChange={updateDefaults}
                users={session.users.map(u => ({ id: u.id, label: u.firstName }))}
                sources={session.sources}
              />
            ) : (
              <Box c="neutral.7">
                Tällä tilauksella ei ole mallikulua tallennettuna. Lisää ensimmäinen automaattisesti
                luotu kirjaus expense-näkymästä.
              </Box>
            )}
          </Tabs.Panel>
        ) : null}
      </Tabs>

      <Group justify="flex-end" gap="xs" pt="md">
        <Button variant="subtle" onClick={onClose}>
          Peruuta
        </Button>
        <Button variant="filled" disabled={!canSave} onClick={save}>
          Tallenna
        </Button>
      </Group>
    </Modal>
  );
};

const FilterEditor: React.FC<{
  filter: ExpenseQuery;
  onChange: (patch: Partial<ExpenseQuery>) => void;
  users: { id: ObjectId; label: string }[];
}> = ({ filter, onChange, users }) => {
  const typeValue = filterTypeAsSingle(filter.type);
  const userValue = filter.userId !== undefined ? String(filter.userId) : 'any';
  const categoryValues = filterCategoryAsArray(filter.categoryId);
  const confirmedValue =
    filter.confirmed === undefined ? 'any' : filter.confirmed ? 'true' : 'false';

  return (
    <Stack gap="sm">
      <Select
        label="Tyyppi"
        data={TYPE_FILTER_OPTIONS}
        value={typeValue ?? 'any'}
        onChange={v => onChange({ type: v && v !== 'any' ? (v as ExpenseType) : undefined })}
        allowDeselect={false}
      />
      <CategoryMultiSelector
        value={categoryValues}
        onChange={ids => onChange({ categoryId: categoryFilterValue(ids) })}
        label="Kategoriat"
        description="Tyhjä = kaikki kategoriat. Voit valita useita."
      />
      <Checkbox
        label="Sisällytä alakategoriat"
        checked={filter.includeSubCategories ?? false}
        onChange={e => onChange({ includeSubCategories: e.currentTarget.checked || undefined })}
      />
      <Select
        label="Käyttäjä"
        data={[
          { value: 'any', label: 'Kaikki käyttäjät' },
          ...users.map(u => ({ value: String(u.id), label: u.label })),
        ]}
        value={userValue}
        onChange={v => onChange({ userId: v && v !== 'any' ? Number(v) : undefined })}
        allowDeselect={false}
      />
      <TextInput
        label="Otsikko sisältää"
        value={filter.title ?? ''}
        onChange={e => onChange({ title: e.currentTarget.value || undefined })}
        placeholder="esim. Lainanhoito"
      />
      <TextInput
        label="Saajan nimi sisältää"
        value={filter.receiver ?? ''}
        onChange={e => onChange({ receiver: e.currentTarget.value || undefined })}
      />
      <TextInput
        label="Vapaa hakusana"
        description="Etsii otsikosta, saajasta ja kuvauksesta."
        value={filter.search ?? ''}
        onChange={e => onChange({ search: e.currentTarget.value || undefined })}
      />
      <Select
        label="Vahvistustila"
        data={TRI_STATE_OPTIONS}
        value={confirmedValue}
        onChange={v =>
          onChange({ confirmed: v === 'true' ? true : v === 'false' ? false : undefined })
        }
        allowDeselect={false}
      />
    </Stack>
  );
};

const DefaultsEditor: React.FC<{
  defaults: ExpenseDefaults;
  onChange: (patch: Partial<ExpenseDefaults>) => void;
  users: { id: ObjectId; label: string }[];
  sources: { id: ObjectId; name: string }[];
}> = ({ defaults, onChange, users, sources }) => (
  <Stack gap="sm">
    <TextInput
      label="Otsikko"
      description="Käytetään automaattisesti luotujen kirjausten nimenä."
      value={defaults.title}
      onChange={e => onChange({ title: e.currentTarget.value })}
      error={defaults.title.trim() ? undefined : 'Otsikko ei voi olla tyhjä'}
    />
    <TextInput
      label="Saaja"
      value={defaults.receiver ?? ''}
      onChange={e => onChange({ receiver: e.currentTarget.value || undefined })}
    />
    <SumField value={Money.from(defaults.sum).toString()} onChange={s => onChange({ sum: s })} />
    <Select
      label="Tyyppi"
      data={TYPE_OPTIONS}
      value={defaults.type}
      onChange={v => v && onChange({ type: v as ExpenseType })}
      allowDeselect={false}
    />
    <CategorySelector
      value={defaults.categoryId}
      onChange={id => onChange({ categoryId: id })}
      label="Kategoria"
    />
    <SourceSelector
      title="Lähde"
      value={defaults.sourceId}
      onChange={id => onChange({ sourceId: id })}
      sources={sources as never}
    />
    <Select
      label="Omistaja"
      data={users.map(u => ({ value: String(u.id), label: u.label }))}
      value={String(defaults.userId)}
      onChange={v => v && onChange({ userId: Number(v) })}
      allowDeselect={false}
    />
    <Checkbox
      label="Alustava kirjaus"
      description="Luodut kirjaukset jäävät vahvistettavaksi käsin."
      checked={!defaults.confirmed}
      onChange={e => onChange({ confirmed: !e.currentTarget.checked })}
    />
    <Textarea
      label="Kuvaus"
      value={defaults.description ?? ''}
      onChange={e => onChange({ description: e.currentTarget.value || null })}
      autosize
      minRows={2}
    />
  </Stack>
);

function initialState(item: Subscription): FormState {
  return {
    title: item.title,
    filter: { ...item.filter },
    defaults: item.defaults ? { ...item.defaults } : undefined,
  };
}

function filterTypeAsSingle(t: ExpenseQuery['type']): ExpenseType | undefined {
  if (!t) return undefined;
  if (Array.isArray(t)) return t[0];
  return t;
}

function filterCategoryAsArray(c: ExpenseQuery['categoryId']): ObjectId[] {
  if (c === undefined) return [];
  return Array.isArray(c) ? c : [c];
}

/**
 * Collapse the multi-select state back to the schema's overloaded shape:
 * an empty selection drops the constraint entirely, a single pick stays
 * scalar (matches what `createSubscriptionFromFilter` writes), and
 * multiple picks travel as an array.
 */
function categoryFilterValue(ids: ObjectId[]): ExpenseQuery['categoryId'] {
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return ids[0];
  return ids;
}

function stripBlanks(filter: ExpenseQuery): ExpenseQuery {
  const out: ExpenseQuery = {};
  for (const [k, v] of Object.entries(filter) as [keyof ExpenseQuery, unknown][]) {
    if (v === undefined || v === '' || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
