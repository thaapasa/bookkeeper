import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { Category, Session, Source, User } from 'shared/types/Session';
import apiConnect from 'client/data/ApiConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { updateSession, validSessionE } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { requestStringValue } from '../general/QueryUser';
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
            {s.name}{' '}
            <IconButton
              size="small"
              aria-label="Nimeä uudelleen"
              onClick={() => renameSource(s)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </ItemWithId>
        ))}
      </Value>
    </InfoItem>
  );
};

async function renameSource(source: Source) {
  const name = await requestStringValue(
    `Vaihda kohteen ${source.name} nimi`,
    'Syötä uusi nimi',
    source.name
  );
  if (name) {
    await apiConnect.patchSource(source.id, { name });
    await updateSession();
  }
}

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(InfoView);
