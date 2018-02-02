export type ConfirmationAction<T> = {
  label: string;
  value: T;
};

export interface ConfirmationObject<T> {
  title: string;
  content: string;
  actions: ConfirmationAction<T>[];
  resolve: (value: T) => void;
}

export interface Notification {
  message: string;
  cause?: any;
};
