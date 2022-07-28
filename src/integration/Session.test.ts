import 'jest';

import { Session } from 'shared/types/Session';
import * as client from 'shared/util/test/TestClient';
import { expectThrow } from 'shared/util/test/TestUtil';

function checkSession(s: Session) {
  expect(s.users).toBeInstanceOf(Array);
  expect(s.groups).toBeInstanceOf(Array);
  expect(typeof s.token).toBe('string');
  expect(s.token.length).toEqual(40);
  expect(typeof s.refreshToken).toBe('string');
  expect(s.refreshToken.length).toEqual(40);
  expect(s.sources).toBeInstanceOf(Array);
  expect(s.categories).toBeInstanceOf(Array);
  expect(typeof s.user).toBe('object');
  expect(typeof s.group).toBe('object');
  expect(s.user).toMatchObject({ firstName: 'Sauli', lastName: 'Niinistö' });
  expect(s.group).toMatchObject({ name: 'Mäntyniemi' });
  return s;
}

describe('session', () => {
  function login(): Promise<client.SessionWithControl> {
    return client.getSession('sale', 'salasana');
  }

  const testUrl = '/api/source/list';

  it('should give session info with GET', async () => {
    const session = await login();
    checkSession(session);
    const s = await session.get<Session>('/api/session');
    checkSession(s);
    const d = await session.get(testUrl);
    expect(d).toBeTruthy();
    await session.logout();
  });

  it('should not return data without token', async () => {
    await expectThrow(() => client.get('', testUrl));
  });

  it('should not allow GET after logout', async () => {
    const session = await login();
    await session.logout();
    await expectThrow(() => session.get(testUrl));
  });

  it('should not allow API access with refreshToken', async () => {
    const session = await login();
    await session.logout();
    await expectThrow(() => client.get(session.refreshToken, testUrl));
  });

  it('should allow refresh with refreshToken', async () => {
    const session = await login();
    const s = await client.refreshSession(session.refreshToken);
    checkSession(s);
    expect(s.token).not.toEqual(session.token);
    expect(s.refreshToken).not.toEqual(session.refreshToken);
    const d = await s.get(testUrl);
    expect(d).toBeTruthy();
    await s.logout();
  });

  it('should not allow refresh with refreshToken after logout', async () => {
    const session = await login();
    await session.logout();
    await expectThrow(() => session.get(testUrl));
    await expectThrow(() => client.refreshSession(session.refreshToken));
  });
});
