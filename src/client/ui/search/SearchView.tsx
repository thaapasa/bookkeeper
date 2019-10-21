import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { Session } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';

class SearchView extends React.Component<{
  userData: UserDataProps;
  session: Session;
}> {
  get user() {
    return this.props.session.user;
  }
  public render() {
    return <SearchContainer>Tee haku</SearchContainer>;
  }
}

const SearchContainer = styled.div`
  font-size: 13px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  box-sizing: border-box;
`;

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(SearchView);
