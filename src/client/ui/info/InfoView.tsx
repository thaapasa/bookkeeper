import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { Session } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';
import { secondaryColors, primaryColors } from '../Colors';

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
        {this.renderUsers()}
        {this.renderCategories()}
        {this.renderSources()}
      </InfoViewContainer>
    );
  }

  renderUsers() {
    return (
      <>
        <InfoItem>
          <Label>Kirjautunut käyttäjä</Label>
          <Value>
            <ItemWithId id={this.user.id}>
              {this.user.firstName} {this.user.lastName}
            </ItemWithId>
          </Value>
        </InfoItem>
        <InfoItem>
          <Label>Käyttäjät</Label>
          <Value>
            {Object.values(this.props.userData.userMap).map(v => (
              <ItemWithId key={v.id} id={v.id}>
                {v.firstName} {v.lastName}
              </ItemWithId>
            ))}
          </Value>
        </InfoItem>
      </>
    );
  }

  renderCategories() {
    return (
      <>
        <InfoItem>
          <Label>Kategoriat</Label>
          <Value>
            {Object.values(this.props.session.categories).map(cat => (
              <ItemWithId key={cat.id} id={cat.id}>
                {cat.name}
                {cat.children.length > 0 ? (
                  <SubValue>
                    {cat.children.map(c => (
                      <ItemWithId key={c.id} id={c.id}>
                        {c.name}
                      </ItemWithId>
                    ))}
                  </SubValue>
                ) : null}
              </ItemWithId>
            ))}
          </Value>
        </InfoItem>
      </>
    );
  }

  renderSources() {
    return (
      <>
        <InfoItem>
          <Label>Lähteet</Label>
          <Value>
            {Object.values(this.props.session.sources).map(s => (
              <ItemWithId key={s.id} id={s.id}>
                {s.name}
              </ItemWithId>
            ))}
          </Value>
        </InfoItem>
      </>
    );
  }
}

const ItemWithId = (props: { id: string | number; children: any }) => (
  <ItemView>
    <IdView>{props.id}</IdView>
    {props.children}
  </ItemView>
);

const InfoViewContainer = styled.div`
  font-size: 13px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  box-sizing: border-box;
`;

const ItemView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin: 4px 0;
`;

const IdView = styled.div`
  padding: 4px 8px;
  background-color: ${secondaryColors.light};
  color: ${secondaryColors.text};
  margin-right: 6px;
  border-radius: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid ${primaryColors.dark};
  &:last-of-type {
    border: none;
  }
`;

const Label = styled.div`
  width: 150px;
  margin: 8px 0;
`;

const Value = styled.div`
  flex-direction: column;
`;

const SubValue = styled(Value)`
  margin-left: 16px;
  display: flex;
`;

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(InfoView);
