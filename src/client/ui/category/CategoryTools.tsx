import * as React from 'react';
import { Category } from '../../../shared/types/Session';
import { ToolIcon, Edit, ExpandLess, ExpandMore, Add } from '../Icons';

export class AddCategoryButton extends React.PureComponent<
  {
    onAdd: (p?: Category) => void;
    parent?: Category;
    color?: string | null;
    icon?: React.ComponentType<any>;
  },
  {}
> {
  private add = () => {
    this.props.onAdd(this.props.parent);
  };
  public render() {
    return (
      <ToolIcon
        title="Lisää"
        onClick={this.add}
        icon={this.props.icon || Add}
        color={this.props.color}
      />
    );
  }
}

export class EditCategoryButton extends React.PureComponent<
  {
    onEdit: (p: Category) => void;
    category: Category;
    color?: string | null;
  },
  {}
> {
  private edit = () => {
    this.props.onEdit(this.props.category);
  };
  public render() {
    return (
      <ToolIcon
        title="Muokkaa"
        onClick={this.edit}
        icon={Edit}
        color={this.props.color}
      />
    );
  }
}

export class ToggleButton extends React.PureComponent<
  {
    state: boolean;
    onToggle: (c?: Category) => void;
    category?: Category;
    color?: string | null;
  },
  {}
> {
  private toggle = () => {
    this.props.onToggle(this.props.category);
  };
  public render() {
    return (
      <ToolIcon
        title={this.props.state ? 'Sulje' : 'Avaa'}
        onClick={this.toggle}
        icon={this.props.state ? ExpandLess : ExpandMore}
        color={this.props.color}
      />
    );
  }
}
