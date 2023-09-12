import React from 'react';

import { ReceiverFieldProps } from '../expense/dialog/ReceiverField';
import { TextEditProps } from './TextEdit';

export type TextEditorComponent = React.ComponentType<TextEditProps> | React.ComponentType<ReceiverFieldProps>;
