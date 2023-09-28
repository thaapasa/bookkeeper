import { Router } from 'express';

import { TrackingSubjectData } from 'shared/types';
import { getTrackingSubjectsForUser } from 'server/data/tracking/TrackingDb';
import { createTrackingSubject } from 'server/data/tracking/TrackingService';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates tracking API router.
 * Assumed attach path: `/api/tracking`
 */
export function createProfileApi() {
  const api = createValidatingRouter(Router());

  // PUT /api/tracking
  api.putTx('/', { body: TrackingSubjectData }, (tx, session, { body }) =>
    createTrackingSubject(tx, session.group.id, session.user.id, body),
  );

  // GET /api/tracking/list
  api.getTx('/list', {}, (tx, session, {}) =>
    getTrackingSubjectsForUser(tx, session.group.id, session.user.id),
  );

  return api.router;
}
