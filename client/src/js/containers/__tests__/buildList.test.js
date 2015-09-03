import {BuildListContainer} from '../buildList';


describe('BuildListContainer', () => {
  jsdom();

  const props = {
    builds: [1, 2, 3].map(x => factory.build({travisId: x})),
    fetchBuildList: () => {},
    repo: '',
    user: '',
    setPageTypes: () => {},
    setTitle: () => {},
  };

  it('renders', () => {
    const component = ReactDOMHelper.render(
      <StubRouterProvider component={BuildListContainer} {...props}/>
    );
    assert.equal(
      ReactDOMHelper.queryClassAll(component, 'build-list-build').length,
      3);
  });

  it('calls fetchBuildList', done => {
    const assertProps = Object.assign({}, props, {
      fetchBuildList: () => done()
    });
    ReactDOMHelper.render(
      <StubRouterProvider component={BuildListContainer} {...assertProps}/>
    );
  });
});
