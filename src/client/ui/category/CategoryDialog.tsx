import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { Button } from '@material-ui/core';
import apiConnect from '../../data/ApiConnect';
import { Category } from '../../../shared/types/Session';
import { notify, notifyError } from '../../data/State';
import debug from 'debug';

const log = debug('bookkeeper:category-dialog');

const defaultCategory: Category[] = [
  { id: 0, name: '[Ei yläkategoriaa]', children: [], parentId: null },
];

interface CategoryDialogProps {
  categories: Category[];
}

type CategoryResolve = (c: number | null) => void;

interface CategoryDialogState {
  open: boolean;
  name: string;
  parentId: number;
  id: number;
  createNew: boolean;
  resolve: CategoryResolve | null;
  valid: boolean;
}

export default class CategoryDialog extends React.Component<
  CategoryDialogProps,
  any
> {
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
    log('Create category under', parent);
    return this.startEditing({
      open: true,
      name: '',
      parentId: parent ? parent.id : 0,
      createNew: true,
      id: 0,
      valid: true,
    });
  };

  public editCategory = (category: Category): Promise<number | null> => {
    log('Edit category', category);
    return this.startEditing({
      open: true,
      name: category.name,
      parentId: category.parentId || 0,
      createNew: false,
      id: category.id,
      valid: true,
    });
  };

  private getCategories(): Category[] {
    return defaultCategory.concat(this.props.categories);
  }

  private startEditing(
    s: Partial<CategoryDialogState>
  ): Promise<number | null> {
    return new Promise<number | null>(resolve => {
      this.setState({ ...s, resolve });
    });
  }

  private closeDialog = (id: number | null) => {
    log('Closing dialog, resolving to', id);
    this.setState({ open: false });
    if (this.state.resolve) {
      this.state.resolve(id);
    }
    return false;
  };

  private requestSave = (event: React.SyntheticEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
    this.saveCategory(this.state);
  };

  private async saveCategory(s: CategoryDialogState): Promise<number | null> {
    const createNew = !s.id;
    const name = s.name;

    const data = {
      name: s.name,
      parentId: s.parentId,
      children: [],
    };
    log('Save category data', data);
    try {
      const id = createNew
        ? (await apiConnect.storeCategory(data)).categoryId || 0
        : (await apiConnect.updateCategory(s.id, data)).id;
      this.closeDialog(id);
      notify(`${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`);
      return id;
    } catch (e) {
      notifyError(
        `Virhe ${
          createNew ? 'tallennettaessa' : 'päivitettäessä'
        } kirjausta ${name}`,
        e
      );
      return null;
    }
  }

  private cancel = () => {
    this.closeDialog(null);
  };

  private updateName = (_: any, name: string) => {
    this.setState({ name, valid: name && name.length > 0 });
  };

  private changeCategory = (i: any, j: any, v: number) => {
    this.setState({ parentId: v });
  };

  public render() {
    const actions = [
      <Button key="cancel" variant="text" onClick={this.cancel}>
        Peruuta
      </Button>,
      <Button
        key="save"
        variant="text"
        color="primary"
        disabled={!this.state.valid}
        onClick={this.requestSave}
      >
        Tallenna
      </Button>,
    ];

    return (
      <Dialog
        className="category-dialog"
        title={this.state.createNew ? 'Uusi kategoria' : 'Muokkaa kategoriaa'}
        actions={actions}
        modal={true}
        autoDetectWindowHeight={true}
        autoScrollBodyContent={true}
        open={this.state.open}
        onRequestClose={this.cancel}
      >
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
            onChange={this.changeCategory}
          >
            {this.getCategories().map(c => (
              <MenuItem key={c.id} value={c.id} primaryText={c.name} />
            ))}
          </SelectField>
        </form>
      </Dialog>
    );
  }
}
