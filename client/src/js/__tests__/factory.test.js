function build(fields) {
  return Object.assign({}, {
    id: 42,
    captures: [],
    travisBranch: 'testBranch',
    travisCommit: 'abc',
    travisId: 123,
    travisPullRequest: 456,
    travisRepoSlug: 'ngokevin/sherlocked',
  }, fields);
}


global.factory = {
  build: build
};
