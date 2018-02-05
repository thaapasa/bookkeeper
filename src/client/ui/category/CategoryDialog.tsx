import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import * as apiConnect from '../../data/ApiConnect';
import { Category } from '../../../shared/types/Session';
import { SyntheticEvent } from 'react';
import { notify, notifyError } from '../../data/State';
const debug = require('debug')('bookkeeper:category-dialog');

const defaultCategory: Category[] = [{ id: 0, name: '[Ei yläkategoriaa]', children: [], parentId: null }];

interface CategoryDialogProps {
  categories: Category[];
}

type CategoryResolve = (c: number | null) => void;

interface CategoryDialogState {
  open: boolean,
  name: string,
  parentId: number,
  id: number,
  createNew: boolean,
  resolve: CategoryResolve | null,
  valid: boolean,
}

export default class CategoryDialog extends React.Component<CategoryDialogProps, any> {

  public state: CategoryDialogState = {
    open: false,
    name: '',
    parentId: 0,
    id: 0,
    createNew: false,
    valid: false,
    resolve: null,
  };

  public createCategory = (parent?: Category): Promise<number | null> => {
    debug('Create category under', parent);
    return this.startEditing({ open: true, name: '', parentId: parent ? parent.id : 0, createNew: true, id: 0, valid: true });
  }

  public editCategory = (category: Category): Promise<number | null> => {
    debug('Edit category', category);
    return this.startEditing({ open: true, name: category.name, parentId: category.parentId || 0, createNew: false, id: category.id, valid: true });
  }

  private getCategories(): Category[] {
    return defaultCategory.concat(this.props.categories);
  }

  private startEditing(s: Partial<CategoryDialogState>): Promise<number | null> {
    return new Promise<number | null>((resolve) => {
      this.setState({ ...s, resolve });
    });
  }

  private closeDialog = (id: number | null) => {
    debug('Closing dialog, resolving to', id);
    this.setState({ open: false });
    if (this.state.resolve) { this.state.resolve(id); }
    return false;
  }

  private requestSave = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
    this.saveCategory(this.state);
  }

  private async saveCategory(s: CategoryDialogState) {
    const createNew = !s.id;
    const name = s.name;

    const data = {
      name: s.name,
      parentId: s.parentId,
      children: [],
    };
    debug('Save category data', data);
    try {
      const id = createNew ?
        (await apiConnect.storeCategory(data)).categoryId || 0 :
        (await apiConnect.updateCategory(s.id, data)).id;
      this.closeDialog(id);
      notify(`${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`);
    } catch (e) {
      notifyError(`Virhe ${createNew ? 'tallennettaessa' : 'päivitettäessä'} kirjausta ${name}`, e);
      return null;
    }
  }

  private cancel = () => {
    this.closeDialog(null);
  }

  private updateName = (_: any, name: string) => {
    this.setState({ name, valid: name && name.length > 0 });
  }

  private changeCategory = (i: any, j: any, v: number) => {
    this.setState({ parentId: v });
  }

  public render() {
    const actions = [
      <FlatButton
        label="Peruuta"
        primary={true}
        onClick={this.cancel} />,
      <FlatButton
        label="Tallenna"
        primary={true}
        disabled={!this.state.valid}
        keyboardFocused={true}
        onClick={this.requestSave} />
    ];

    return <Dialog
      contentClassName="category-dialog"
      title={this.state.createNew ? 'Uusi kategoria' : 'Muokkaa kategoriaa'}
      actions={actions}
      modal={true}
      autoDetectWindowHeight={true}
      autoScrollBodyContent={true}
      open={this.state.open}
      onRequestClose={this.cancel}>
      <form onSubmit={this.requestSave}>
        <TextField
          key="name"
          hintText="Nimi"
          floatingLabelText="Nimi"
          floatingLabelFixed={true}
          fullWidth={true}
          value={this.state.name}
          onChange={this.updateName}
        />
        <SelectField
          key="category"
          value={this.state.parentId}
          floatingLabelText="Yläkategoria"
          floatingLabelFixed={true}
          style={{ width: '100%' }}
          onChange={this.changeCategory}>
          {this.getCategories().map((c) => (
            <MenuItem key={c.id} value={c.id} primaryText={c.name} />
          ))}
        </SelectField>
      </form>
    </Dialog>
  }
}
