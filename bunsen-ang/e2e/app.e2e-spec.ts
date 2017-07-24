import { BunsenPage } from './app.po';

describe('bunsen App', () => {
  let page: BunsenPage;

  beforeEach(() => {
    page = new BunsenPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
