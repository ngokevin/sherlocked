import {LandingContainer} from '../landing';


describe('LandingContainer', () => {
  jsdom();

  const props = {
    setPageTypes: () => {}
  };

  it('renders', () => {
    const component = ReactDOMHelper.render(
      <LandingContainer {...props}/>
    );
    assert.ok(
      ReactDOMHelper.queryClassAll(component, 'landing').length,
    );
  });
});
