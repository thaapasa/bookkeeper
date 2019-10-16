import { Paper } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import React from 'react';
import Autosuggest, {
  InputProps,
  RenderSuggestionsContainerParams,
  SuggestionSelectedEventData,
  SuggestionsFetchRequestedParams,
} from 'react-autosuggest';
import styled from 'styled-components';
import { highlightBg, highlightFg } from '../Colors';
import { eventValue } from 'client/util/ClientUtil';

export interface AutoCompleteProps<T> {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string | React.ChangeEvent<{ value: string }>) => void;
  suggestions: T[];
  onUpdateSuggestions: (input: string) => void;
  onClearSuggestions: () => void;
  onSelectSuggestion: (suggestion: T) => void;
  getSuggestionValue: (suggestion: T) => string;
  fullWidth?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  label?: string;
  errorText?: string;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
}

export default class AutoComplete<T> extends React.Component<
  AutoCompleteProps<T>
> {
  public render() {
    return (
      <Autosuggest
        id={this.props.id}
        inputProps={{
          name: this.props.name,
          value: this.props.value,
          onChange: this.setInputValue,
          style: { margin: '6px 0' },
          onKeyUp: this.props.onKeyUp,
        }}
        getSuggestionValue={this.props.getSuggestionValue}
        onSuggestionsFetchRequested={this.fetchSuggestions}
        onSuggestionsClearRequested={this.props.onClearSuggestions}
        suggestions={this.props.suggestions}
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
    this.props.onUpdateSuggestions(params.value);
  };

  private setInputValue = async (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChange(e);
    this.props.onUpdateSuggestions(eventValue(e));
  };

  private renderSuggestion = (
    item: T,
    params: { query: string; isHighlighted: boolean }
  ) => {
    return (
      <Item className={params.isHighlighted ? 'highlight' : 'normal'}>
        {this.props.getSuggestionValue(item)}
      </Item>
    );
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
        autoFocus={this.props.autoFocus}
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

const StandardTextField = styled(TextField)`
  margin: 8px 0;
  position: relative;
`;

const FloatingPaper = styled(Paper)`
  position: absolute;
  padding-right: 32px;
  z-index: 2;
`;

const Item = styled.div`
  padding: 4px 8px;
  &.highlight {
    background: ${highlightBg};
    color: ${highlightFg};
  }
`;