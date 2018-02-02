import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import * as colors from '../Colors';
import { NavigateLeft, NavigateRight } from '../Icons';
import { KeyCodes } from '../../util/Io';
import { Moment } from 'moment';
import { expensesForMonthPath } from '../../util/Links';
import { History } from 'history';
import styled from 'styled-components';
import { fixedHorizontal } from '../Styles';
import { getFinnishMonthName } from '../../../shared/util/Time';

interface ExpenseNavigationProps {
  readonly date: Moment;
  readonly history: History;
}

const NavigationContainer = fixedHorizontal.extend`
  height: 48px !important;
  top: 56px;
  display: flex;
  align-items: center;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const TitleArea = styled.div`
  text-align: center;
  flex-grow: 1;
  font-size: 12pt;
  color: ${colors.header};
`;

export default class ExpenseNavigation extends React.Component<ExpenseNavigationProps, {}> {

  public static getYearMonthString(date: Moment): string {
    return getFinnishMonthName(date.month() + 1) + ' ' + date.year();
  }

  private navigateMonths = (offset: number) => {
    const toDate = this.props.date.clone().add(offset, 'months');
    this.props.history.push(expensesForMonthPath(toDate.toDate()));
  }

  private handleKeyPress = (event) => {
    switch (event.keyCode) {
      case KeyCodes.right:
        this.navigateMonths(1);
        return false;
      case KeyCodes.left:
        this.navigateMonths(-1);
        return false;
    }
  }

  public render() {
    return (
      <NavigationContainer onKeyUp={this.handleKeyPress} tabIndex={1}>
        <div>
          <StyledIconButton onClick={() => this.navigateMonths(-1)}
            title="Edellinen"><NavigateLeft color={colors.navigation} /></StyledIconButton>
        </div>
        <TitleArea>{ExpenseNavigation.getYearMonthString(this.props.date)}</TitleArea>
        <div>
          <StyledIconButton onClick={() => this.navigateMonths(1)}
            title="Seuraava"><NavigateRight color={colors.navigation} /></StyledIconButton>
        </div>
      </NavigationContainer>
    );
  }
}
