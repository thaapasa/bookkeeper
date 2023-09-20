import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import * as React from 'react';

interface UploadImageButtonProps {
  onSelect: (file: any, filename: string) => Promise<void>;
  style?: React.CSSProperties;
}

export const UploadImageButton: React.FC<React.PropsWithChildren<UploadImageButtonProps>> = ({
  onSelect,
  children,
  style,
}) => {
  const ref = React.useRef<HTMLInputElement | null>(null);

  const selectFile = async (e: any) => {
    e.preventDefault();
    const files = e.dataTransfer?.files ?? e.target?.files;
    if (!files || !files[0]) return;
    await onSelect(files[0], files[0].name);
    const input = ref.current;
    if (input) {
      input.value = '';
    }
  };

  return (
    <>
      <IconButton onClick={() => ref.current?.click()} style={style}>
        {children}
      </IconButton>
      <FileInput type="file" id="upload-file" onChange={selectFile} ref={ref} />
    </>
  );
};

const FileInput = styled('input')`
  display: none;
`;
