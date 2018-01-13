import * as React from 'react';
import TextField from 'material-ui/TextField';
import AutoComplete from 'material-ui/AutoComplete';
import { AutoCompleteProps, TextFieldProps } from 'material-ui';

export function PlainTextField(props: TextFieldProps) {
    return <TextField {...props}
        style={{ ...props.style, margin: 0, padding: 0 }}
        inputStyle={{ ...props.inputStyle, margin: 0, padding: 0, fontSize: '11pt' }} />;
}

export function PlainAutoComplete<T>(props: AutoCompleteProps<T>) {
    return <AutoComplete {...props}
        style={{ ...props.style, margin: 0, padding: 0 }}
        inputStyle={{ ...props.inputStyle, padding: 0, margin: 0, fontSize: '11pt' }}/>;
}
