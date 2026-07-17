import { Badge, Button, Group, Paper, Select, Stack, Table, Text } from '@mantine/core';
import React from 'react';

import { ParsedStatement } from 'shared/statement';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';

import { Icons } from '../icons/Icons';
import { StatementRowsTable } from './StatementRowsTable';
import { SourceOption } from './statementSources';

const PREVIEW_ROW_COUNT = 8;

interface StatementUploadPreviewProps {
  filename: string;
  parsed: ParsedStatement;
  sourceOptions: SourceOption[];
  initialSourceId: number | undefined;
  onImport: (sourceId: number) => void;
  onCancel: () => void;
  importing: boolean;
}

const formatLabels = { op: 'OP', spankki: 'S-pankki' };

/**
 * Preview of a parsed statement file before committing the upload: row
 * count, date range, sample rows, and the target source selection.
 */
export const StatementUploadPreview: React.FC<StatementUploadPreviewProps> = ({
  filename,
  parsed,
  sourceOptions,
  initialSourceId,
  onImport,
  onCancel,
  importing,
}) => {
  const [sourceId, setSourceId] = React.useState<number | undefined>(initialSourceId);
  const rows = parsed.rows;
  const dates = rows.map(r => r.bookingDate).sort();
  const total = rows.reduce((sum, r) => sum.plus(r.amount), Money.from(0));

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group gap="sm">
          <Badge variant="light" color="primary" radius="sm">
            {formatLabels[parsed.format]}
          </Badge>
          <Text fw={600}>{filename}</Text>
        </Group>
        <Group gap="xl">
          <Text fz="sm">{rows.length} tapahtumaa</Text>
          {rows.length > 0 ? (
            <Text fz="sm">
              {readableDateWithYear(dates[0])} – {readableDateWithYear(dates[dates.length - 1])}
            </Text>
          ) : null}
          <Text fz="sm">Muutos yhteensä {total.format()}</Text>
        </Group>
        <StatementRowsTable rows={rows.slice(0, PREVIEW_ROW_COUNT)}>
          {rows.length > PREVIEW_ROW_COUNT ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text fz="sm" c="dimmed">
                  … ja {rows.length - PREVIEW_ROW_COUNT} muuta tapahtumaa
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </StatementRowsTable>
        {sourceOptions.length > 0 ? (
          <Select
            label="Tili"
            description="Tiliotteen tapahtumat liitetään tähän lähteeseen"
            data={sourceOptions.map(o => ({ value: `${o.id}`, label: o.name }))}
            value={sourceId !== undefined ? `${sourceId}` : null}
            onChange={v => setSourceId(v ? Number(v) : undefined)}
            maw={320}
          />
        ) : (
          <Text fz="sm" c="red.7">
            Yhdelläkään lähteellä ei ole tiliotemuotoa {formatLabels[parsed.format]}. Määritä muoto
            lähteelle Tiedot-sivulla.
          </Text>
        )}
        <Group gap="sm">
          <Button
            leftSection={<Icons.Upload />}
            disabled={sourceId === undefined}
            loading={importing}
            onClick={() => sourceId !== undefined && onImport(sourceId)}
          >
            Tuo tapahtumat
          </Button>
          <Button variant="default" onClick={onCancel} disabled={importing}>
            Peruuta
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};
