import * as React from 'react';
import * as B from 'baconjs';
import { Session } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';
import { PageContentContainer } from '../Styles';

class SearchView extends React.Component<{
  userData: UserDataProps;
  session: Session;
}> {
  public render() {
    return (
      <PageContentContainer className="padded">Tee haku</PageContentContainer>
    );
  }
}

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(SearchView);
