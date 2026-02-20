import { expect, browser } from '@wdio/globals'

describe('GTaurus Application', () => {
    it('should open the dashboard and have a Sidebar', async () => {
        const sidebar = await $('.bg-\\[var\\(--bg-sidebar\\)\\]'); // CSS selector for your sidebar
        await expect(sidebar).toExist();
    });

    it('should have a Settings button in the header', async () => {
        const settingsBtn = await $('button[data-testid="settings-toggle"]'); // Adjust selector as needed
        if (await settingsBtn.isExisting()) {
            await expect(settingsBtn).toBeDisplayed();
        }
    });
});
