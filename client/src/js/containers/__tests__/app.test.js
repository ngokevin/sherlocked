import {AppContainer} from '../app';


describe('AppContainer', () => {
  jsdom();

  const props = {
    children: {},
    pageTypes: [],
    title: '',
  };

  it('renders', () => {
    const component = ReactDOMHelper.render(
      <StubRouterProvider component={AppContainer} {...props}/>
    );
    assert.ok(ReactDOMHelper.queryClassAll(component, 'app').length);
  });
});
