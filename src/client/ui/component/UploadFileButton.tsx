import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import * as React from 'react';

interface UploadImageButtonProps {
  onSelect: (file: File, filename: string) => Promise<any>;
  style?: React.CSSProperties;
  title?: string;
  className?: string;
}

interface WithDatatransfer {
  dataTransfer?: {
    files?: FileList;
  };
}

export const UploadImageButton: React.FC<React.PropsWithChildren<UploadImageButtonProps>> = ({
  onSelect,
  children,
  style,
  title,
  className,
}) => {
  const ref = React.useRef<HTMLInputElement | null>(null);

  const selectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = (e as WithDatatransfer).dataTransfer?.files ?? e.target?.files;
    if (!files || !files[0]) return;
    const file = files[0];
    await onSelect(file, file.name);
    const input = ref.current;
    if (input) {
      input.value = '';
    }
  };

  return (
    <>
      <IconButton
        onClick={() => ref.current?.click()}
        style={style}
        title={title}
        className={className}
      >
        {children}
      </IconButton>
      <FileInput type="file" id="upload-file" onChange={selectFile} ref={ref} />
    </>
  );
};

const FileInput = styled('input')`
  display: none;
`;
