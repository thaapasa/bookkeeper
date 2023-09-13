import { MaybePromise } from 'shared/util';
import { notify, notifyError } from 'client/data/State';
import { UserPrompts } from 'client/ui/dialog/DialogState';

type ExecutionOptions<T> = {
  progress?: string;
  success?: string | ((v: T) => string);
  throw?: boolean;
  confirm?: string;
  confirmTitle?: string;
  postProcess?: (t: T) => MaybePromise<any>;
};

export async function executeOperation<T>(
  f: (() => Promise<T>) | Promise<T>,
  options: ExecutionOptions<T> = {},
) {
  try {
    if (options.confirm) {
      const c = await UserPrompts.confirm(options.confirmTitle ?? 'Varmistus', options.confirm);
      if (!c) return;
    }

    // Show notification during operation
    if (options.progress) {
      notify(options.progress, { severity: 'info' });
    }
    const res: T = await (typeof f === 'function' ? f() : f);

    // Post-process
    if (options.postProcess) {
      await options.postProcess(res);
    }

    // Show success notification
    if (options.success) {
      notify(typeof options.success === 'function' ? options.success(res) : options.success, {
        immediate: true,
      });
    }

    return res;
  } catch (e: any) {
    // Show error notification
    notifyError(`Hups! Joku meni vikaan`, e, { immediate: true });

    if (options.throw) {
      throw e;
    }
    return undefined;
  }
}
