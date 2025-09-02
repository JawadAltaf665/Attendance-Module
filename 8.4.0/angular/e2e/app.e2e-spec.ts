import { AttendanceModuleTemplatePage } from './app.po';

describe('AttendanceModule App', function() {
  let page: AttendanceModuleTemplatePage;

  beforeEach(() => {
    page = new AttendanceModuleTemplatePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
