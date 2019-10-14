import { Paper } from '@material-ui/core';
import TextField, { StandardTextFieldProps } from '@material-ui/core/TextField';
import React from 'react';
import Autosuggest, {
  InputProps,
  RenderSuggestionsContainerParams,
  SuggestionSelectedEventData,
  SuggestionsFetchRequestedParams,
} from 'react-autosuggest';
import styled from 'styled-components';

export interface AutoCompleteProps<T> {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  placeholder?: string;
  getSuggestions: (input: string) => T[];
  getSuggestionValue: (item: T) => string;
  renderSuggestion: (item: T) => string;
  onSelectSuggestion: (item: T) => void;
  style?: React.CSSProperties;
  label?: string;
  errorText?: string;
}

interface AutoCompleteState<T> {
  suggestions: T[];
}

export default class AutoComplete<T> extends React.Component<
  AutoCompleteProps<T>,
  AutoCompleteState<T>
> {
  public state: AutoCompleteState<T> = { suggestions: [] };
  public render() {
    return (
      <Autosuggest
        inputProps={{
          value: this.props.value,
          onChange: this.setInputValue,
        }}
        getSuggestionValue={this.renderSuggestion}
        onSuggestionsFetchRequested={this.fetchSuggestions}
        onSuggestionsClearRequested={this.clearSuggestions}
        suggestions={this.state.suggestions}
        renderSuggestionsContainer={this.renderContainer}
        renderSuggestion={this.renderSuggestion}
        renderInputComponent={this.renderInput}
        onSuggestionSelected={this.onSelectSuggestion}
      />
    );
  }

  private onSelectSuggestion = (
    _: React.FormEvent<any>,
    data: SuggestionSelectedEventData<T>
  ) => {
    this.props.onSelectSuggestion(data.suggestion);
  };

  private fetchSuggestions = (params: SuggestionsFetchRequestedParams) => {
    this.setState({
      suggestions: this.props.getSuggestions(params.value),
    });
  };
  private clearSuggestions = () => this.setState({ suggestions: [] });

  private setInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (typeof value !== 'string') {
      return;
    }
    this.props.onChange(value);
    this.setState({
      suggestions: this.props.getSuggestions(value),
    });
  };

  private renderSuggestion = (item: T) => {
    return this.props.renderSuggestion(item);
  };

  private renderContainer = (params: RenderSuggestionsContainerParams) => {
    return (
      <FloatingPaper {...params.containerProps} square={true}>
        {params.children}
      </FloatingPaper>
    );
  };

  private renderInput = (props: InputProps<T>) => {
    const {
      inputRef = () => {
        // Ignore
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      defaultValue,
      ref,
      ...other
    } = props;

    return (
      <StandardTextField
        {...other}
        name={this.props.name}
        fullWidth={this.props.fullWidth}
        placeholder={this.props.placeholder}
        type="text"
        error={Boolean(this.props.errorText)}
        helperText={this.props.errorText}
        InputProps={{
          inputRef: node => {
            ref(node);
            inputRef(node);
          },
        }}
        onChange={this.setInputValue}
      />
    );
  };
}

const StandardTextField = TextField as React.ComponentType<
  StandardTextFieldProps
>;

const FloatingPaper = styled(Paper)`
  position: absolute;
  padding-right: 32px;
  z-index: 1;
`;
