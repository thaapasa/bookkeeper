import { Router } from 'express';

import { TrackingSubjectData } from 'shared/types';
import { getTrackingSubjectsForUser } from 'server/data/tracking/TrackingDb';
import {
  createTrackingSubject,
  deleteTrackingSubject,
  getTrackingSubject,
  updateTrackingSubject,
} from 'server/data/tracking/TrackingService';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates tracking API router.
 * Assumed attach path: `/api/tracking`
 */
export function createTrackingApi() {
  const api = createValidatingRouter(Router());

  // POST /api/tracking
  api.postTx('/', { body: TrackingSubjectData }, (tx, session, { body }) =>
    createTrackingSubject(tx, session.group.id, session.user.id, body),
  );

  // GET /api/tracking/list
  api.getTx('/list', {}, (tx, session, {}) =>
    getTrackingSubjectsForUser(tx, session.group.id, session.user.id),
  );

  // GET /api/tracking/:id
  api.getTx('/:id', {}, (tx, session, { params }) =>
    getTrackingSubject(tx, session.group.id, session.user.id, params.id),
  );

  // PUT /api/tracking/:id
  api.putTx('/:id', { body: TrackingSubjectData }, (tx, session, { body, params }) =>
    updateTrackingSubject(tx, session.group.id, session.user.id, params.id, body),
  );

  // DELETE /api/tracking/:id
  api.deleteTx('/:id', {}, (tx, session, { params }) =>
    deleteTrackingSubject(tx, session.group.id, session.user.id, params.id),
  );

  return api.router;
}
