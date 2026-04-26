import React from 'react';
import { create } from 'zustand';

import { ISODate } from 'shared/time';
import { ObjectId } from 'shared/types';

import { TextEditProps } from '../component/TextEdit';
import { ReceiverFieldProps } from '../expense/dialog/ReceiverField';
import { CategoryPromptDialogContents } from './CategoryPromptDialogContents';
import { DateSelectDialogComponent } from './DateSelectDialogContents';
import { DialogConfig, DialogData, DialogSelectOption } from './Dialog';
import { OptionSelectDialogContents } from './OptionSelectDialogContents';
import { TextPromptDialogContents } from './TextPromptDialogContents';

export type TextEditorComponent =
  | React.ComponentType<TextEditProps>
  | React.ComponentType<ReceiverFieldProps>;

interface DialogStoreState {
  config: DialogConfig<any, any> | null;
  setConfig: (config: DialogConfig<any, any> | null) => void;
}

export const useDialogStore = create<DialogStoreState>(set => ({
  config: null,
  setConfig: config => set({ config }),
}));

function promptUser<T, D extends DialogData>(config: Omit<DialogConfig<T, D>, 'resolve'>) {
  return new Promise<T | undefined>(resolve => {
    useDialogStore.getState().setConfig({ ...config, resolve } as DialogConfig<any, any>);
  });
}

export const UserPrompts = {
  /**
   * Ask the user confirmation from the users with a dialog.
   * Returns a promise that will be resolved to either true of false depending on user input.
   */
  confirm: (title: string, description: React.ReactNode): Promise<true | false> =>
    promptUser({
      type: 'option',
      title,
      rendererProps: { description, options: [{ value: true, label: 'OK' }] },
      contentRenderer: OptionSelectDialogContents,
    }).then(a => a === true),

  /**
   * Ask the user to select one of the presented options.
   * Returns a promise that will be resolved to one of the options; or undefined if the dialog
   * was cancelled.
   */
  select: <T>(
    title: string,
    description: React.ReactNode,
    options: DialogSelectOption<T>[],
  ): Promise<T | undefined> =>
    promptUser({
      type: 'option',
      title,
      rendererProps: { description, options },
      contentRenderer: OptionSelectDialogContents,
    }),

  /**
   * Ask the user to input a text string in a dialog.
   * Returns a promise that will be resolved to the text that was entered; or undefined if the dialog
   * was cancelled.
   */
  promptText: (
    title: string,
    description: React.ReactNode,
    initialText?: string,
    editorType?: TextEditorComponent,
  ): Promise<string | undefined> =>
    promptUser({
      type: 'text',
      title,
      rendererProps: { description, initialText, editorType },
      contentRenderer: TextPromptDialogContents,
    }),

  /**
   * Ask the user to input a text string in a dialog.
   * Returns a promise that will be resolved to the text that was entered; or undefined if the dialog
   * was cancelled.
   */
  selectDate: (title: string, initialDate?: ISODate): Promise<ISODate | undefined> =>
    promptUser({
      type: 'date',
      title,
      rendererProps: { initialDate },
      contentRenderer: DateSelectDialogComponent,
    }),

  /**
   * Ask the user to select a category.
   * Returns a promise that will be resolved to the category that was selected.
   */
  promptCategory: (title: string, description: React.ReactNode): Promise<ObjectId | undefined> =>
    promptUser({
      type: 'category',
      title,
      rendererProps: { description },
      contentRenderer: CategoryPromptDialogContents,
    }),
};
