import revision from './revision';

export const config = {
  ...revision,
  revision: revision.commitId.substr(0, 8),
};
