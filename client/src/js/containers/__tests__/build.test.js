import {BuildContainer} from '../build';


describe('BuildContainer', () => {
  jsdom();

  const props = {
    buildId: 42,
    build: factory.build(),
    fetchBuild: () => {},
    setPageTypes: () => {},
    setTitle: () => {},
  };

  it('renders', () => {
    const component = ReactDOMHelper.render(
      <BuildContainer {...props}/>
    );
    assert.ok(ReactDOMHelper.queryClassAll(component, 'build').length);
  });

  it('calls fetchBuild', done => {
    const assertProps = Object.assign({}, props, {
      fetchBuild: buildId => {
        assert.equal(buildId, 42);
        done();
      }
    });
    ReactDOMHelper.render(
      <BuildContainer {...assertProps}/>
    );
  });
});
