import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
} from '@mui/material';
import * as React from 'react';

import { Category } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';

const defaultCategory: Category[] = [
  { id: 0, name: '[Ei yläkategoriaa]', children: [], parentId: null },
];

interface CategoryDialogProps {
  categories: Category[];
}

type CategoryResolve = (c: number | null | PromiseLike<number | null>) => void;

interface CategoryDialogState {
  open: boolean;
  name: string;
  parentId: number;
  id: number;
  createNew: boolean;
  resolve: CategoryResolve | null;
  valid: boolean;
}

const Form = styled('form')`
  position: relative;
  z-index: 1;
`;

const DialogControl = styled(FormControl)`
  width: 100%;
  margin: 8px 0 !important;
  box-sizing: border-box;
`;

export default class CategoryDialog extends React.Component<
  CategoryDialogProps,
  CategoryDialogState
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
    logger.info({ parent }, 'Create category under');
    return this.startEditing({
      open: true,
      name: '',
      parentId: parent ? parent.id : 0,
      createNew: true,
      id: 0,
      valid: false,
    });
  };

  public editCategory = (category: Category): Promise<number | null> => {
    logger.info({ category }, 'Edit category');
    return this.startEditing({
      open: true,
      name: category.name,
      parentId: category.parentId || 0,
      createNew: false,
      id: category.id,
      valid: true,
    });
  };

  get categories(): Category[] {
    return defaultCategory.concat(this.props.categories);
  }

  private startEditing(s: Partial<CategoryDialogState>): Promise<number | null> {
    return new Promise<number | null>(resolve => {
      this.setState({ ...s, resolve } as any);
    });
  }

  private closeDialog = (id: number | null) => {
    logger.info(`Closing dialog, resolving to ${id}`);
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

  private async saveCategory(s: CategoryDialogState): Promise<number | undefined> {
    const createNew = !s.id;
    const name = s.name;

    const data = {
      name: s.name,
      parentId: s.parentId,
      children: [],
    };
    logger.info({ data }, 'Save category data');
    return executeOperation(
      () =>
        createNew
          ? apiConnect.storeCategory(data).then(c => c.categoryId || 0)
          : apiConnect.updateCategory(s.id, data).then(c => c.id),
      {
        success: `${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
        postProcess: this.closeDialog,
      },
    );
  }

  private cancel = () => {
    this.closeDialog(null);
  };

  private updateName = (name: string) => {
    this.setState({ name, valid: (name && name.length > 0) || false });
  };

  private changeCategory = (e: SelectChangeEvent<number>, _child: React.ReactNode) => {
    this.setState({ parentId: Number(e.target.value) });
  };

  public render() {
    return (
      <Dialog
        className="category-dialog"
        fullWidth={true}
        open={this.state.open}
        onClose={this.cancel}
      >
        <DialogTitle>{this.state.createNew ? 'Uusi kategoria' : 'Muokkaa kategoriaa'}</DialogTitle>
        <DialogContent>
          <Form onSubmit={this.requestSave}>
            <DialogControl>
              <TextEdit
                label="Nimi"
                key="name"
                placeholder="Nimi"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                fullWidth={true}
                value={this.state.name}
                onChange={this.updateName}
              />
            </DialogControl>
            <DialogControl>
              <InputLabel htmlFor="category-dialog-parentId">Yläkategoria</InputLabel>
              <Select
                labelId="category-dialog-parentId"
                label="Yläkategoria"
                value={this.state.parentId}
                fullWidth={true}
                onChange={this.changeCategory}
              >
                {this.categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </DialogControl>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={this.cancel}>
            Peruuta
          </Button>
          <Button
            variant="text"
            color="primary"
            disabled={!this.state.valid}
            onClick={this.requestSave}
          >
            Tallenna
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
