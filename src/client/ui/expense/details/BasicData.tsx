import * as React from 'react';
import styled from 'styled-components';
import * as colors from '../../Colors';
import IconButton from 'material-ui/IconButton';
import { UserExpense } from '../../../../shared/types/Expense';
import { media } from '../../Styles';
import { User, Source } from '../../../../shared/types/Session';

interface BasicDataProps {
  expense: UserExpense;
  user: User;
  source: Source;
  fullCategoryName: string;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
}

const styles = {
  tool: {
    margin: '0',
    padding: '0',
    width: 36,
    height: 36,
  },
  toolIcon: {
    color: colors.tool,
    fontSize: '15pt',
  },
};

export default class BasicData extends React.Component<BasicDataProps, {}> {
  private onModify = () => {
    this.props.onModify(this.props.expense);
  }
  private onDelete = () => {
    this.props.onDelete(this.props.expense);
  }
  public render() {
    return (
      <SmallDeviceContainer>
        <BasicDataArea>
          <DetailRow name="Kirjaaja" value={this.props.user.firstName} />
          <DetailRow name="Kohde" value={this.props.expense.receiver} />
          <DetailRow name="Kategoria" value={this.props.fullCategoryName} />
          <DetailRow name="Lähde" value={this.props.source.name} />
        </BasicDataArea>
        <ExpenseToolsArea>
          <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.tool} iconStyle={styles.toolIcon}
            onClick={this.onModify}>edit</IconButton>
          <IconButton iconClassName="material-icons" title="Poista" style={styles.tool} iconStyle={styles.toolIcon}
            onClick={this.onDelete}>delete</IconButton>
        </ExpenseToolsArea>
      </SmallDeviceContainer>
    );
  }

}

function DetailRow(props: { name: string, value: string }) {
  return (
    <div className="expense-detail-mobile">
      <span className="detail-label">{props.name + ':'}</span>
      {props.value}
    </div>
  );
}

const SmallDeviceContainer = styled.div`
  display: none;

  ${media.small`
    display: block;
  `}
`;

const BasicDataArea = styled.div`
  display: inline-block;
  max-width: 35em;
  min-width: 20em;
  height: auto;
`;

const ExpenseToolsArea = styled.div`
  display: inline-block;
  width: auto;
  vertical-align: top;
`;
