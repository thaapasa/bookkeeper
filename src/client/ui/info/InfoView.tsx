import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { Session } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';

class InfoView extends React.Component<{
  userData: UserDataProps;
  session: Session;
}> {
  get user() {
    return this.props.session.user;
  }
  public render() {
    return (
      <InfoViewContainer>
        <InfoItem>
          <Label>Kirjautunut käyttäjä</Label>
          <Value>
            {this.user.id}: {this.user.firstName} {this.user.lastName}
          </Value>
        </InfoItem>
        <InfoItem>
          <Label>Käyttäjät</Label>
          <Value>
            {Object.values(this.props.userData.userMap).map(v => (
              <React.Fragment key={v.id}>
                {v.id}: {v.firstName} {v.lastName}
                <br />
              </React.Fragment>
            ))}
          </Value>
        </InfoItem>
      </InfoViewContainer>
    );
  }
}

const InfoViewContainer = styled.div`
  font-size: 13px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  margin: 8px;
`;

const Label = styled.div`
  width: 150px;
`;

const Value = styled.div``;

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(InfoView);
