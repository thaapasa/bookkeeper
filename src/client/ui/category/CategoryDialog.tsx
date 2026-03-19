import styled from '@emotion/styled';
import { Button, Modal, Select } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';

const defaultCategory: Category[] = [
  {
    id: 0,
    name: '[Ei yläkategoriaa]',
    children: [],
    parentId: null,
    fullName: '[Ei yläkategoriaa]',
  },
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

const Form = styled.form`
  position: relative;
  z-index: 1;
`;

const DialogControl = styled.div`
  width: 100%;
  margin: 8px 0;
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
    const result = await executeOperation(
      () =>
        createNew
          ? apiConnect.storeCategory(data).then(c => c.categoryId || 0)
          : apiConnect.updateCategory(s.id, data).then(c => c.id),
      {
        success: `${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
        postProcess: this.closeDialog,
      },
    );
    return result;
  }

  private cancel = () => {
    this.closeDialog(null);
  };

  private updateName = (name: string) => {
    this.setState({ name, valid: (name && name.length > 0) || false });
  };

  private changeCategory = (value: string | null) => {
    this.setState({ parentId: Number(value ?? 0) });
  };

  public render() {
    return (
      <Modal
        opened={this.state.open}
        onClose={this.cancel}
        title={this.state.createNew ? 'Uusi kategoria' : 'Muokkaa kategoriaa'}
        size="lg"
      >
        <Form onSubmit={this.requestSave}>
          <DialogControl>
            <TextEdit
              label="Nimi"
              key="name"
              placeholder="Nimi"
              value={this.state.name}
              onChange={this.updateName}
            />
          </DialogControl>
          <DialogControl>
            <Select
              label="Yläkategoria"
              value={String(this.state.parentId)}
              onChange={this.changeCategory}
              data={this.categories.map(c => ({ value: String(c.id), label: c.name }))}
            />
          </DialogControl>
        </Form>
        <Actions>
          <Button variant="subtle" onClick={this.cancel}>
            Peruuta
          </Button>
          <Button variant="filled" disabled={!this.state.valid} onClick={this.requestSave}>
            Tallenna
          </Button>
        </Actions>
      </Modal>
    );
  }
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
`;
