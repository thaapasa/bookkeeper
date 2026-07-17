import { ActionIcon, Badge, Group, Table, Text } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import { StatementUploadListItem } from 'shared/statement';
import { toDateTime } from 'shared/time';
import { ObjectId } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { useUserMap } from 'client/data/SessionStore';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Icons } from '../icons/Icons';

const formatLabels = { op: 'OP', spankki: 'S-pankki' };

const rowCountText = (n: number) => (n === 1 ? '1 tapahtuma' : `${n} tapahtumaa`);

/**
 * List of upload batches for one source, with batch delete. Deleting a
 * batch removes only the rows the batch owns (was the first to import).
 */
export const StatementUploadsList: React.FC<{ sourceId: ObjectId }> = ({ sourceId }) => {
  const queryClient = useQueryClient();
  const userMap = useUserMap();
  const { data: uploads } = useSuspenseQuery({
    queryKey: QueryKeys.statements.uploads(sourceId),
    queryFn: () => apiConnect.getStatementUploads(sourceId),
  });

  const deleteUpload = (upload: StatementUploadListItem) =>
    executeOperation(() => apiConnect.deleteStatementUpload(upload.id), {
      confirmTitle: 'Poista tuonti',
      confirm:
        `Poistetaanko tuonti ${upload.filename}? ` +
        (upload.currentRowCount > 0
          ? `Samalla poistetaan sen tuomat tapahtumat (${rowCountText(upload.currentRowCount)}).`
          : 'Tuonti ei omista yhtään tapahtumaa, joten tapahtumia ei poisteta.'),
      success: r =>
        r.deletedRowCount > 0
          ? `Tuonti ja ${rowCountText(r.deletedRowCount)} poistettu`
          : 'Tuonti poistettu',
      postProcess: () => queryClient.invalidateQueries({ queryKey: QueryKeys.statements.all }),
    });

  if (uploads.length < 1) {
    return (
      <Text fz="sm" c="dimmed">
        Ei tuonteja tälle tilille.
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={560}>
      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={140}>Tuotu</Table.Th>
            <Table.Th>Tiedosto</Table.Th>
            <Table.Th w={100} visibleFrom="sm">
              Tuoja
            </Table.Th>
            <Table.Th w={90} ta="right">
              Uusia
            </Table.Th>
            <Table.Th w={90} ta="right" visibleFrom="sm">
              Ohitettu
            </Table.Th>
            <Table.Th w={110} ta="right">
              Tapahtumia
            </Table.Th>
            <Table.Th w={50} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {uploads.map(u => (
            <Table.Tr key={u.id}>
              <Table.Td>
                <Text fz="sm" style={{ whiteSpace: 'nowrap' }}>
                  {toDateTime(u.uploadedAt).toFormat('d.M.yyyy HH:mm')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light" color="primary" radius="sm">
                    {formatLabels[u.format]}
                  </Badge>
                  <Text fz="sm" truncate>
                    {u.filename}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td visibleFrom="sm">
                <Text fz="sm" c="dimmed">
                  {userMap?.[u.uploadedBy]?.firstName ?? `#${u.uploadedBy}`}
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text fz="sm">{u.newCount}</Text>
              </Table.Td>
              <Table.Td ta="right" visibleFrom="sm">
                <Text fz="sm" c="dimmed">
                  {u.duplicateCount}
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text fz="sm" fw={600}>
                  {u.currentRowCount}
                </Text>
              </Table.Td>
              <Table.Td>
                <ActionIcon title="Poista tuonti" color="red" onClick={() => void deleteUpload(u)}>
                  <Icons.Delete />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
