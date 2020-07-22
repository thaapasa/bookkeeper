import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { Session, Source, Category, User } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';
import { secondaryColors, primaryColors } from '../Colors';
import { PageContentContainer } from '../Styles';

const InfoView = (props: { userData: UserDataProps; session: Session }) => (
  <PageContentContainer className="padded">
    <UsersView user={props.session.user} userMap={props.userData.userMap} />
    <CategoriesView categories={props.session.categories} />
    <SourcesView sources={props.session.sources} />
  </PageContentContainer>
);

const UsersView = ({
  user,
  userMap,
}: {
  user: User;
  userMap: Record<string, User>;
}) => (
  <>
    <InfoItem>
      <Label>Kirjautunut käyttäjä</Label>
      <Value>
        <ItemWithId id={user.id}>
          {user.firstName} {user.lastName}
        </ItemWithId>
      </Value>
    </InfoItem>
    <InfoItem>
      <Label>Käyttäjät</Label>
      <Value>
        {Object.values(userMap).map(v => (
          <ItemWithId key={v.id} id={v.id}>
            {v.firstName} {v.lastName}
          </ItemWithId>
        ))}
      </Value>
    </InfoItem>
  </>
);

const CategoriesView = ({ categories }: { categories: Category[] }) => (
  <InfoItem>
    <Label>Kategoriat</Label>
    <Value>
      {Object.values(categories).map(cat => (
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
);

const SourcesView = ({ sources }: { sources: Source[] }) => (
  <InfoItem>
    <Label>Lähteet</Label>
    <Value>
      {Object.values(sources).map(s => (
        <ItemWithId key={s.id} id={s.id}>
          {s.name}
        </ItemWithId>
      ))}
    </Value>
  </InfoItem>
);

const ItemWithId = (props: { id: string | number; children: any }) => (
  <ItemView>
    <IdView>{props.id}</IdView>
    {props.children}
  </ItemView>
);

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
