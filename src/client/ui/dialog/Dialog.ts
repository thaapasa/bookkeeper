export type DialogSelectOption<T> = {
  value: T;
  label: string;
};

export type OptionSelectDialogData<T> = {
  type: 'option';
  description: string;
  options: DialogSelectOption<T>[];
};

export type TextPromptDialogData = {
  type: 'text';
  description: string;
  initialText?: string;
};

export type DialogData = OptionSelectDialogData<any> | TextPromptDialogData;

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
