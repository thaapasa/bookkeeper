import revision from './revision';

export const config = {
  ...revision,
  revision: revision.commitId.substring(0, 8),
};
