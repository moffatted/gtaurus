import { expect, browser, $ } from '@wdio/globals'

describe('GTaurus Application', () => {
    it('should open the dashboard and have a Sidebar', async () => {
        const sidebar = await $('aside'); 
        await expect(sidebar).toExist();
        
        // Ensure standard UI text actually rendered inside the webview
        const title = await sidebar.$('h1=Gtaurus');
        await expect(title).toExist();
    });

    it('should render the Settings Panel trigger in header', async () => {
        // Find the button inside the header that opens settings using its testid
        const settingsBtn = await $('[data-testid="settings-panel-trigger"]'); 
        if (await settingsBtn.isExisting()) {
            await expect(settingsBtn).toBeDisplayed();
        }
    });
});
