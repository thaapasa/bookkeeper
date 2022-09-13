import * as B from 'baconjs';
import * as React from 'react';

import { ObjectId } from 'shared/types/Id';
import { Category, Session, Source, User } from 'shared/types/Session';
import apiConnect from 'client/data/ApiConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { updateSession, validSessionE } from 'client/data/Login';

import { ActivatableTextField } from '../component/ActivatableTextField';
import { connect } from '../component/BaconConnect';
import { PageContentContainer } from '../Styles';
import {
  InfoItem,
  ItemWithId,
  Label,
  SubValue,
  Value,
} from './InfoLayoutElements';
import { VersionInfoView } from './VersionInfoView';

const InfoView = (props: { userData: UserDataProps; session: Session }) => (
  <PageContentContainer className="padded">
    <VersionInfoView />
    <UsersView user={props.session.user} userMap={props.userData.userMap} />
    <SourcesView sources={props.session.sources} />
    <CategoriesView categories={props.session.categories} />
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

const SourcesView = ({ sources }: { sources: Source[] }) => {
  return (
    <InfoItem>
      <Label>Lähteet</Label>
      <Value>
        {Object.values(sources).map(s => (
          <ItemWithId key={s.id} id={s.id}>
            <ActivatableTextField
              value={s.name}
              onChange={name => renameSource(s.id, name)}
              width="360px"
            />
          </ItemWithId>
        ))}
      </Value>
    </InfoItem>
  );
};

async function renameSource(sourceId: ObjectId, name: string) {
  if (name) {
    await apiConnect.patchSource(sourceId, { name });
    await updateSession();
  }
}

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(InfoView);
