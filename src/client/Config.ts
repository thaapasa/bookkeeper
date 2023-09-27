import revision from './revision.json';

export const config = {
  ...revision,
  revision: revision.commitId.substring(0, 8),
};
