import { Box, Select } from '@mantine/core';
import * as React from 'react';

import { DialogContentRendererProps, ListSelectDialogData } from './Dialog';
import { DialogFooter } from './DialogFooter';

type ListSelectDialogProps = DialogContentRendererProps<string> & ListSelectDialogData;

/**
 * Dialog contents that let the user pick one entry from a dropdown. Used when
 * the option list is too long or too uniform to render as one button per
 * option (see OptionSelectDialogContents for that variant).
 */
export const ListSelectDialogContents: React.FC<ListSelectDialogProps> = ({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
  options,
  placeholder,
}) => {
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <>
      <Box onKeyUp={handleKeyPress}>
        <Box mb="xs">{description}</Box>
        <Select
          data={options}
          value={selected}
          onChange={setSelected}
          placeholder={placeholder ?? 'Valitse…'}
          searchable
        />
      </Box>
      <DialogFooter
        onCancel={onCancel}
        onOk={() => selected !== null && onSelect(selected)}
        okDisabled={selected === null}
        handleKeyPress={handleKeyPress}
      />
    </>
  );
};
