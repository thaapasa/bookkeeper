import React from 'react';

import { ISODate } from 'shared/time';

import { TextEditorComponent } from './DialogState';

export type DialogSelectOption<T> = {
  value: T;
  label: string;
};

export type OptionSelectDialogData<T> = {
  type: 'option';
  description: React.ReactNode;
  options: DialogSelectOption<T>[];
};

export type TextPromptDialogData = {
  type: 'text';
  description: React.ReactNode;
  initialText?: string;
  editorType?: TextEditorComponent;
};

export type CategoryPromptDialogData = {
  type: 'category';
  description: React.ReactNode;
};

export type DateSelectDialogData = {
  type: 'date';
  initialDate?: ISODate;
};

export type DialogData =
  | OptionSelectDialogData<any>
  | TextPromptDialogData
  | DateSelectDialogData
  | CategoryPromptDialogData;

export interface DialogContentRendererProps<T> {
  onSelect: (value: T) => void;
  onCancel: () => void;
  handleKeyPress?: (event: React.KeyboardEvent<any>) => void;
}

export type DialogConfig<T, D extends DialogData> = {
  title: string;
  enterResolution?: T;
  resolve(value: PromiseLike<T> | T | undefined): void;
  contentRenderer: React.ComponentType<DialogContentRendererProps<T> & D>;
  rendererProps: Omit<D, 'type' | keyof DialogContentRendererProps<T>>;
  type: D['type'];
};
