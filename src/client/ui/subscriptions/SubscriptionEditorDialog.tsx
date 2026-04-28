import {
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { z } from 'zod';

import {
  ExpenseDefaults,
  ExpenseQuery,
  ExpenseType,
  expenseTypes,
  getExpenseTypeLabel,
  QuerySummary,
  Subscription,
  SubscriptionUpdate,
} from 'shared/expense';
import { ObjectId } from 'shared/types';
import { Money, noop } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { QueryKeys } from 'client/data/queryKeys';
import { useUserData, useValidSession } from 'client/data/SessionStore';
import { executeOperation } from 'client/util/ExecuteOperation';

import { CategoryMultiSelector } from '../component/CategoryMultiSelector';
import { CategorySelector } from '../component/CategorySelector';
import { SourceSelector, SumField } from '../expense/dialog/ExpenseDialogComponents';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';

interface Props {
  /**
   * The subscription to edit, or undefined to open in create mode for a
   * new stats subscription. New subscriptions can't have a `defaults`
   * blob — that path stays owned by the expense-row "convert to
   * recurring" flow — so the Mallikulu tab is implicitly hidden when
   * `item` is missing.
   */
  item?: Subscription;
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

const TYPE_OPTIONS = expenseTypes.map(t => ({ value: t, label: getExpenseTypeLabel(t) }));

export const SubscriptionEditorDialog: React.FC<Props> = ({ item, opened, onClose }) => {
  const session = useValidSession();
  const isCreate = !item;
  const hasRecurrence = !!item?.recurrence;

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
  const defaultsErrors = validateDefaults(state.defaults);
  const canSave = titleValid && defaultsErrors === null;

  const save = async () => {
    if (isCreate) {
      await executeOperation(
        () =>
          apiConnect.createSubscriptionFromFilter(state.title.trim(), stripBlanks(state.filter)),
        {
          success: 'Tilaus luotu',
          postProcess: () => {
            invalidateSubscriptionData();
            onClose();
          },
        },
      );
      return;
    }
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
    <Modal
      opened={opened}
      onClose={onClose}
      title={isCreate ? 'Uusi tilastotilaus' : 'Muokkaa tilausta'}
      size="lg"
    >
      <Tabs defaultValue="general" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="general">Yleiset</Tabs.Tab>
          <Tabs.Tab value="filter">Suodatin</Tabs.Tab>
          <Tabs.Tab value="preview">Esikatselu</Tabs.Tab>
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

        <Tabs.Panel value="preview" pt="md">
          <PreviewPanel filter={state.filter} />
        </Tabs.Panel>

        {hasRecurrence ? (
          <Tabs.Panel value="defaults" pt="md">
            {state.defaults ? (
              <DefaultsEditor
                defaults={state.defaults}
                onChange={updateDefaults}
                users={session.users.map(u => ({ id: u.id, label: u.firstName }))}
                sources={session.sources}
                errors={defaultsErrors ?? {}}
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
  const typeValues = filterTypeAsArray(filter.type);
  const userValue = filter.userId !== undefined ? String(filter.userId) : 'any';
  const categoryValues = filterCategoryAsArray(filter.categoryId);
  const confirmedValue =
    filter.confirmed === undefined ? 'any' : filter.confirmed ? 'true' : 'false';

  return (
    <Stack gap="sm">
      <MultiSelect
        label="Tyyppi"
        description="Tyhjä = kaikki tyypit. Voit valita useita."
        data={TYPE_OPTIONS}
        value={typeValues}
        onChange={vs => onChange({ type: typeFilterValue(vs.filter(isExpenseType)) })}
        clearable
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
        description="Etsii otsikosta ja saajasta."
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

interface DefaultsErrors {
  title?: string;
  sum?: string;
  sourceId?: string;
  categoryId?: string;
  userId?: string;
}

const DefaultsEditor: React.FC<{
  defaults: ExpenseDefaults;
  onChange: (patch: Partial<ExpenseDefaults>) => void;
  users: { id: ObjectId; label: string }[];
  sources: { id: ObjectId; name: string }[];
  errors: DefaultsErrors;
}> = ({ defaults, onChange, users, sources, errors }) => (
  <Stack gap="sm">
    <TextInput
      label="Otsikko"
      description="Käytetään automaattisesti luotujen kirjausten nimenä."
      value={defaults.title}
      onChange={e => onChange({ title: e.currentTarget.value })}
      error={errors.title}
    />
    <TextInput
      label="Saaja"
      value={defaults.receiver ?? ''}
      onChange={e => onChange({ receiver: e.currentTarget.value || undefined })}
    />
    <SumField
      value={Money.from(defaults.sum).toString()}
      onChange={s => onChange({ sum: s })}
      errorText={errors.sum}
    />
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
      error={errors.categoryId}
    />
    <SourceSelector
      title="Lähde"
      value={defaults.sourceId}
      onChange={id => onChange({ sourceId: id })}
      sources={sources as never}
      errorText={errors.sourceId}
    />
    <Select
      label="Omistaja"
      data={users.map(u => ({ value: String(u.id), label: u.label }))}
      value={String(defaults.userId)}
      onChange={v => v && onChange({ userId: Number(v) })}
      allowDeselect={false}
      error={errors.userId}
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

/**
 * Editor-side schema: extends the shared `ExpenseDefaults` with the
 * UI-stricter rules the dialog needs (non-empty trimmed title, real
 * picked IDs rather than the 0 sentinel a `<Select>` can emit before
 * the user touches it). Layering on top of the shared schema means a
 * future tightening or new field on `ExpenseDefaults` flows through
 * automatically — there is no second copy of the rules to keep in
 * sync.
 */
const PositiveId = ObjectId.refine(v => v > 0);
const EditorDefaults = ExpenseDefaults.extend({
  title: z.string().trim().min(1),
  sourceId: PositiveId,
  categoryId: PositiveId,
  userId: PositiveId,
});

/**
 * Localized messages keyed by `ExpenseDefaults` field path. The schema
 * is the source of truth for *what* is invalid; this map translates
 * the issue path into the user-visible string.
 */
const DEFAULTS_ERROR_MESSAGES: Record<keyof DefaultsErrors, string> = {
  title: 'Otsikko ei voi olla tyhjä',
  sum: 'Anna kelvollinen summa',
  sourceId: 'Valitse lähde',
  categoryId: 'Valitse kategoria',
  userId: 'Valitse omistaja',
};

function validateDefaults(defaults: ExpenseDefaults | undefined): DefaultsErrors | null {
  if (!defaults) return null;
  const res = EditorDefaults.safeParse(defaults);
  if (res.success) return null;
  const errors: DefaultsErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string' || !(key in DEFAULTS_ERROR_MESSAGES)) continue;
    const field = key as keyof DefaultsErrors;
    if (!errors[field]) errors[field] = DEFAULTS_ERROR_MESSAGES[field];
  }
  return Object.keys(errors).length === 0 ? null : errors;
}

const PREVIEW_LIMIT = 50;

const PreviewPanel: React.FC<{ filter: ExpenseQuery }> = ({ filter }) => {
  const userData = useUserData()!;
  const previewFilter = React.useMemo(() => stripBlanks(filter), [filter]);
  const isEmpty = Object.keys(previewFilter).length === 0;
  // Debounce so typing into title/receiver/search inputs doesn't fire a
  // server query on every keystroke — staleTime: 0 below means each
  // distinct queryKey is a fresh hit, so we want to settle on a value
  // before letting it through.
  const [debouncedFilter] = useDebouncedValue(previewFilter, 300);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<QuerySummary>({
    queryKey: QueryKeys.subscriptions.preview(debouncedFilter),
    queryFn: () => apiConnect.summarizeSubscriptionQuery(debouncedFilter, { limit: PREVIEW_LIMIT }),
    enabled: !isEmpty,
    staleTime: 0,
  });

  if (isEmpty) {
    return (
      <Text size="sm" c="neutral.7">
        Suodatin on tyhjä — tilaus osuisi kaikkiin kirjauksiin. Lisää vähintään yksi rajaus
        Suodatin-välilehdellä.
      </Text>
    );
  }

  if (isLoading || (!data && isFetching)) {
    return (
      <Group py="xs">
        Lasketaan ... <Loader size="xs" />
      </Group>
    );
  }

  if (isError) {
    return (
      <Stack gap="xs">
        <Text size="sm" c="red.7">
          Esikatselu epäonnistui: {error instanceof Error ? error.message : 'Tuntematon virhe'}
        </Text>
        <Button variant="subtle" size="xs" onClick={() => refetch()}>
          Yritä uudelleen
        </Button>
      </Stack>
    );
  }

  if (!data) return null;

  if (data.count === 0) {
    return (
      <Text size="sm" c="neutral.7">
        Suodatin ei osu yhteenkään kirjaukseen viimeisen viiden vuoden aikana.
      </Text>
    );
  }

  const truncated = data.count > data.matches.length;
  return (
    <Stack gap="xs">
      <Text size="sm" c="neutral.7">
        {data.count} kirjausta · yhteensä {Money.from(data.sum).format()}
      </Text>
      <ExpenseTableLayout>
        <Table.Tbody>
          {data.matches.map(e => (
            <ExpenseRow
              key={e.id}
              expense={e}
              userData={userData}
              addFilter={noop}
              onUpdated={noop}
              editable={false}
            />
          ))}
        </Table.Tbody>
      </ExpenseTableLayout>
      {truncated ? (
        <Text size="xs" c="neutral.7">
          Näytetään {data.matches.length} viimeisintä — yhteensä {data.count} osumaa.
        </Text>
      ) : null}
    </Stack>
  );
};

function initialState(item: Subscription | undefined): FormState {
  if (!item) return { title: '', filter: {} };
  return {
    title: item.title,
    filter: { ...item.filter },
    defaults: item.defaults ? { ...item.defaults } : undefined,
  };
}

function filterTypeAsArray(t: ExpenseQuery['type']): ExpenseType[] {
  if (!t) return [];
  return Array.isArray(t) ? t : [t];
}

function isExpenseType(value: string): value is ExpenseType {
  return (expenseTypes as readonly string[]).includes(value);
}

/**
 * Collapse the multi-select state back to the schema's overloaded shape:
 * empty drops the constraint, a single pick stays scalar (matches what
 * older filters were stored as), and multiple picks travel as an array.
 */
function typeFilterValue(types: ExpenseType[]): ExpenseQuery['type'] {
  if (types.length === 0) return undefined;
  if (types.length === 1) return types[0];
  return types;
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
