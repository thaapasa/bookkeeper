import * as B from 'baconjs';

import { DialogConfig, DialogData, DialogSelectOption } from './Dialog';
import { OptionSelectDialogContents } from './OptionSelectDialogContents';
import { TextPromptDialogContents } from './TextPromptDialogContents';

/* Push event to confirmationBus to show a confirmation dialog */
const dialogActionBus = new B.Bus<DialogConfig<any, any>>();
export const dialogActionE = dialogActionBus;

function promptUser<T, D extends DialogData>(
  config: Omit<DialogConfig<T, D>, 'resolve'>
) {
  return new Promise<T | undefined>(resolve => {
    dialogActionBus.push({ ...config, resolve });
  });
}

export const UserPrompts = {
  /**
   * Ask the user confirmation from the users with a dialog.
   * Returns a promise that will be resolved to either true of false depending on user input.
   */
  confirm: (title: string, description: string): Promise<true | false> =>
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
    description: string,
    options: DialogSelectOption<T>[]
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
    description: string
  ): Promise<string | undefined> =>
    promptUser({
      type: 'text',
      title,
      rendererProps: { description },
      contentRenderer: TextPromptDialogContents,
    }),
};
