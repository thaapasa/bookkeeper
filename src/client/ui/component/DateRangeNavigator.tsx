import * as React from 'react';
import { withRouter, RouteComponentProps } from 'react-router';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import debug from 'debug';
import * as colors from '../Colors';
import { NavigateLeft, NavigateRight } from '../Icons';
import { toDateRangeName, toMoment } from '../../../shared/util/Time';
import { NavigationConfig } from '../../data/StateTypes';
import { yearSuffix, monthSuffix } from '../../util/Links';
import { KeyCodes } from '../../util/Io';
import { navigationP } from '../../data/State';
import { connect } from './BaconConnect';

const log = debug('bookkeeper:navigator');

export interface DateRangeNavigatorProps
  extends NavigationConfig,
    RouteComponentProps<{}> {}

export class DateRangeNavigator extends React.Component<
  DateRangeNavigatorProps
> {
  private navigateOffset = (offset: number) => {
    const rangeSuffix =
      this.props.dateRange.type === 'month'
        ? monthSuffix(
            toMoment(this.props.dateRange.start)
              .clone()
              .add(offset, 'months')
          )
        : yearSuffix(
            toMoment(this.props.dateRange.start)
              .clone()
              .add(offset, 'year')
          );
    const link = this.props.pathPrefix + rangeSuffix;
    log('Navigating to', link);
    this.props.history.push(link);
  };

  private handleKeyPress = (event: React.KeyboardEvent<any>) => {
    switch (event.keyCode) {
      case KeyCodes.right:
        this.navigateOffset(1);
        return false;
      case KeyCodes.left:
        this.navigateOffset(-1);
        return false;
    }
    return;
  };

  private navigateNext = () => this.navigateOffset(1);

  private navigatePrev = () => this.navigateOffset(-1);

  public render() {
    return (
      <NavigationContainer onKeyUp={this.handleKeyPress} tabIndex={1}>
        <div>
          <StyledIconButton onClick={this.navigatePrev} title="Edellinen">
            <NavigateLeft color="primary" />
          </StyledIconButton>
        </div>
        <TitleArea>{toDateRangeName(this.props.dateRange)}</TitleArea>
        <div>
          <StyledIconButton onClick={this.navigateNext} title="Seuraava">
            <NavigateRight color="primary" />
          </StyledIconButton>
        </div>
      </NavigationContainer>
    );
  }
}

const NavigationContainer = styled.div`
  height: 48px !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const TitleArea = styled.div`
  text-align: center;
  width: 140px;
  font-size: 12pt;
  color: ${colors.colorScheme.primary.text};
`;

export default connect(navigationP)(withRouter(DateRangeNavigator));
