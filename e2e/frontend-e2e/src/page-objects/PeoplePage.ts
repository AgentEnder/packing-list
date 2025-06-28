import { Page, expect } from '@playwright/test';

export class PeoplePage {
  constructor(protected page: Page) {}

  async goto() {
    // Use the sidebar navigation instead of direct page.goto
    if (this.page.url().endsWith('/people')) {
      return;
    }
    try {
      // Use exact match to avoid strict mode violation with trip names containing "People"
      const peopleLink = this.page
        .getByRole('link', {
          name: 'People',
          exact: true,
        })
        .filter({ visible: true });
      await peopleLink.waitFor({ state: 'visible', timeout: 10000 });
      await peopleLink.click({ force: true });

      // Wait for the page to load
      await this.page.waitForSelector('[data-testid="add-person-button"]', {
        timeout: 10000,
      });
    } catch (error) {
      console.error('Error navigating to People page:', error);
      // Fallback to direct navigation
      await this.page.goto('/people');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async verifyPeoplePage() {
    await expect(this.page).toHaveURL('/people');
    await expect(
      this.page.getByRole('heading', { name: 'People on this Trip' })
    ).toBeVisible();
  }

  async addPerson(
    name: string,
    age: number,
    gender: 'male' | 'female' | 'other' = 'male'
  ) {
    await this.page.getByTestId('add-person-button').click();
    await this.page.getByTestId('person-name-input').fill(name);
    await this.page.getByTestId('person-age-input').fill(age.toString());
    await this.page.getByTestId('person-gender-select').selectOption(gender);
    await this.page.getByTestId('save-person-button').click();
  }

  async getPeopleCount() {
    // Don't navigate here to avoid state loss - assume we're already on the right page
    const count = await this.page
      .locator('[data-testid^="person-card-"]')
      .count();
    return count;
  }

  async clearAllPeople() {
    const existingPeople = this.page.locator('[data-testid^="person-card-"]');
    const count = await existingPeople.count();
    for (let i = 0; i < count; i++) {
      const firstPerson = existingPeople.first();
      if (await firstPerson.isVisible()) {
        const deleteButton = firstPerson.locator(
          '[data-testid="delete-person-button"]'
        );
        await deleteButton.click();
      }
    }
  }
}
