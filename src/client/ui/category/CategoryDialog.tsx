import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import * as apiConnect from '../../data/ApiConnect';
import * as state from '../../data/State';
const debug = require('debug')('bookkeeper:category-dialog');

const defaultCategory = [{ id: 0, name: '[Ei yläkategoriaa]' }];

export default class CategoryDialog extends React.Component<any, any> {

  private categories: any[];
  private resolve: any;

  constructor(props) {
    super(props);

    this.state = {
      open: false,
      name: "",
      parentId: 0,
      id: 0,
      createNew: false,
      valid: false
    };
    this.categories = [];
    this.resolve = null;

    this.requestSave = this.requestSave.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.createCategory = this.createCategory.bind(this);
    this.editCategory = this.editCategory.bind(this);
    this.update = this.update.bind(this);

    this.updateCategories();
  }

  updateCategories() {
    const cats = state.get("categories");
    this.categories = defaultCategory.concat(cats);
  }

  createCategory(parent) {
    debug("Create category under", parent);
    return this.startEditing({ open: true, name: "", parentId: parent && parent.id || 0, createNew: true, id: 0, valid: true });
  }

  editCategory(category) {
    debug("Edit category", category);
    return this.startEditing({ open: true, name: category.name, parentId: category.parentId || 0, createNew: false, id: category.id, valid: true });
  }

  startEditing(s) {
    this.updateCategories();
    const resolvers = {};
    const promise = new Promise((res) => { this.resolve = res; });
    this.setState(Object.assign(s, resolvers));
    return promise;
  }

  update(name) {
    this.setState({
      name: name,
      valid: name && name.length > 0
    });
  }

  closeDialog(data) {
    debug("Closing dialog");
    this.setState({ open: false });
    this.resolve && this.resolve(data);
    return false;
  }

  requestSave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.setState(s => {
      this.saveCategory(s);
      return s;
    });
  }

  async saveCategory(s) {
    const createNew = !s.id;
    const name = s.name;

    const data = {
      name: s.name,
      parentId: s.parentId,
      children: [],
    };
    debug("Save", data);
    let id = 0;
    try {
      if (createNew) {
        id = (await apiConnect.storeCategory(data)).categoryId || 0;
      } else {
        id = (await apiConnect.updateCategory(s.id, data)).id;
      }
      this.closeDialog(id);
      state.notify(`${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`);
    } catch (e) {
      state.notifyError(`Virhe ${createNew ? 'tallennettaessa' : 'päivitettäessä'} kirjausta ${name}`, e);
      return null;
    }
  }

  public render() {
    const actions = [
      <FlatButton
        label="Peruuta"
        primary={true}
        onClick={() => this.closeDialog(null)} />,
      <FlatButton
        label="Tallenna"
        primary={true}
        disabled={!this.state.valid}
        keyboardFocused={true}
        onClick={this.requestSave} />
    ];

    return <Dialog
      contentClassName="category-dialog"
      title={this.state.createNew ? "Uusi kategoria" : "Muokkaa kategoriaa"}
      actions={actions}
      modal={true}
      autoDetectWindowHeight={true}
      autoScrollBodyContent={true}
      open={this.state.open}
      onRequestClose={() => this.closeDialog(null)}>
      <form onSubmit={this.requestSave} /*onKeyUp={this.handleKeyPress}*/>
        <TextField
          key="name"
          hintText="Nimi"
          floatingLabelText="Nimi"
          floatingLabelFixed={true}
          fullWidth={true}
          value={this.state.name}
          onChange={(e, n) => this.update(n)}
        />
        <SelectField
          key="category"
          value={this.state.parentId}
          floatingLabelText="Yläkategoria"
          floatingLabelFixed={true}
          style={{ width: "100%" }}
          onChange={(i, j, v) => this.setState({ parentId: v })}>
          {this.categories.map((row) => (
            <MenuItem key={row.id} value={row.id} primaryText={row.name} />
          ))}
        </SelectField>
      </form>
    </Dialog>
  }
}
