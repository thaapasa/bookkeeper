"use strict";

import React from "react";
import TextField from "material-ui/TextField";
import AutoComplete from"material-ui/AutoComplete";

export function PlainTextField(props) {
    const style = Object.assign({}, props && props.style, { margin: 0, padding: 0 });
    const inputStyle = Object.assign({}, props && props.inputStyle, { margin: 0, padding: 0, fontSize: "11pt" });
    return React.createElement(TextField, Object.assign({}, props, { style: style, inputStyle: inputStyle }));
}

export function PlainAutoComplete(props) {
    const style = Object.assign({}, props && props.style, { margin: 0, padding: 0 });
    const inputStyle = Object.assign({}, props && props.inputStyle, { margin: 0, padding: 0, fontSize: "11pt" });
    const usedProps = Object.assign({}, props, { floatingLabelText: undefined, style: style, inputStyle: inputStyle });
    return React.createElement(AutoComplete, usedProps);
}
