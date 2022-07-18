import * as React from 'react';
import * as B from 'baconjs';
import { identity } from 'shared/util/Util';
import apiConnect from 'client/data/ApiConnect';
import AutoComplete from '../../component/AutoComplete';
import { unsubscribeAll } from 'client/util/ClientUtil';

export interface ReceiverFieldProps {
  id: string;
  name?: string;
  value: string;
  title: string;
  fullWidth?: boolean;
  placeholder?: string;
  errorText?: string;
  autoFocus?: boolean;
  onChange: (event: string | React.ChangeEvent<{ value: string }>) => void;
  onBlur?: () => void;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
}

interface ReceiverFieldState {
  receivers: string[];
}

export class ReceiverField extends React.Component<
  React.PropsWithChildren<ReceiverFieldProps>,
  ReceiverFieldState
> {
  private searchStream = new B.Bus<string>();
  private unsub: any[] = [];

  public state: ReceiverFieldState = { receivers: [] };

  public componentDidMount() {
    this.unsub.push(this.searchStream.onValue(v => this.props.onChange(v)));
    this.unsub.push(
      this.searchStream
        .filter(v => (v && v.length > 2) || false)
        .debounceImmediate(500)
        .flatMapLatest(v => B.fromPromise(apiConnect.queryReceivers(v)))
        .onValue(v => this.setState({ receivers: v }))
    );
    this.unsub.push(
      this.searchStream
        .filter(v => !v || v.length < 3)
        .onValue(() => this.setState({ receivers: [] }))
    );
  }

  public componentWillUnmount() {
    this.searchStream.end();
    unsubscribeAll(this.unsub);
  }

  public render() {
    return (
      <AutoComplete
        name={this.props.name}
        id={this.props.id}
        value={this.props.value}
        onChange={this.props.onChange}
        label={this.props.title}
        fullWidth={this.props.fullWidth}
        placeholder={this.props.placeholder}
        suggestions={this.state.receivers}
        onUpdateSuggestions={this.updateReceivers}
        onClearSuggestions={this.clearReceivers}
        onSelectSuggestion={this.selectReceiver}
        getSuggestionValue={identity}
        errorText={this.props.errorText}
        onKeyUp={this.props.onKeyUp}
        autoFocus={this.props.autoFocus}
      />
    );
  }

  private updateReceivers = (search: string) => this.searchStream.push(search);

  private selectReceiver = (receiver: string) => this.props.onChange(receiver);

  private clearReceivers = async () => this.setState({ receivers: [] });
}

export class PlainReceiverField extends React.Component<
  React.PropsWithChildren<ReceiverFieldProps>
> {
  public render() {
    return (
      <ReceiverField {...this.props} value={this.props.value || ''}>
        {this.props.children}
      </ReceiverField>
    );
  }
}
