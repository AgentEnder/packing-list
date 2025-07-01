import { Page, expect } from '@playwright/test';
import { getUserProfile } from '../auth-utils';

export class UserPeoplePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to the user profile page
   */
  async gotoProfile() {
    if (this.page.url().includes('/profile')) {
      return;
    }
    // Direct navigation to profile page - simpler and more reliable

    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');

    // Verify we're on the profile page (with or without trailing slash)
    await expect(this.page).toHaveURL(/\/profile\/?$/);

    // Ensure clean state is maintained after profile visit
    await this.page.evaluate(() => {
      if ((window as any).store) {
        const store = (window as any).store;
        // Clear any trips that might have been loaded/synced during profile visit
        store.dispatch({ type: 'CLEAR_ALL_TRIPS' });
        store.dispatch({ type: 'SELECT_TRIP', payload: { tripId: null } });
      }
    });
  }

  /**
   * Navigate to the people management page
   */
  async gotoPeopleManagement() {
    await this.page
      .getByRole('link', { name: 'People' })
      .filter({
        visible: true,
      })
      .click();
    await this.page.getByRole('link', { name: 'Manage Templates' }).click();
    await expect(this.page).toHaveURL(/\/people\/manage\/?/);
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateProfile(options: {
    name: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  }) {
    await this.gotoProfile();

    // Wait for the profile form to be available
    await this.page.waitForSelector('form', { timeout: 10000 });

    // Fill form fields using the profile form test IDs
    const nameInput = this.page.getByTestId('profile-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(options.name);

    if (options.age !== undefined) {
      // Convert age to birth date (rough approximation for testing)
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - options.age;
      const birthDate = `${birthYear}-01-01`;

      const birthDateInput = this.page.getByTestId('profile-birthdate-input');
      await birthDateInput.fill(birthDate);
    }

    if (options.gender) {
      const genderSelect = this.page.getByTestId('profile-gender-select');
      await genderSelect.selectOption(options.gender);
    }

    // Click save button
    const saveButton = this.page.getByTestId('profile-save-button');
    await saveButton.click();

    // Wait for save to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify profile exists and displays correctly
   */
  async expectProfileExists(name: string, age?: number, gender?: string) {
    await this.gotoProfile();

    // Wait for the form to be fully loaded and populated
    await this.page.waitForSelector('[data-testid="profile-name-input"]', {
      timeout: 10000,
    });

    // Wait a bit for any async data loading to complete
    await this.page.waitForTimeout(2000);

    // Check if profile form has the expected values
    const nameInput = this.page.getByTestId('profile-name-input');
    await expect(nameInput).toHaveValue(name);

    if (age !== undefined) {
      // Check birth date field (approximate)
      const currentYear = new Date().getFullYear();
      const expectedBirthYear = currentYear - age;
      const birthDateInput = this.page.getByTestId('profile-birthdate-input');

      // Wait for the birth date to be populated
      await expect(async () => {
        const birthDateValue = await birthDateInput.inputValue();
        if (birthDateValue) {
          const actualBirthYear = parseInt(birthDateValue.split('-')[0]);
          expect(
            Math.abs(actualBirthYear - expectedBirthYear)
          ).toBeLessThanOrEqual(1);
        } else {
          throw new Error('Birth date not populated yet');
        }
      }).toPass({ timeout: 10000 });
    }

    if (gender) {
      const genderSelect = this.page.getByTestId('profile-gender-select');
      await expect(genderSelect).toHaveValue(gender);
    }
  }

  /**
   * Create a person template (non-profile person)
   */
  async createPersonTemplate(options: {
    name: string;
    age: number;
    gender?: 'male' | 'female' | 'other';
  }) {
    await this.gotoPeopleManagement();

    // Click "Add Template" button using test ID
    await this.page.getByTestId('add-template-button').click();

    // Wait for the form to appear
    await this.page.waitForSelector('[data-testid="template-name-input"]', {
      timeout: 5000,
    });

    // Fill the template form using the correct test IDs from TemplateForm.tsx
    await this.page.getByTestId('template-name-input').fill(options.name);

    // Convert age to birth date (rough approximation)
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - options.age;
    const birthDate = `${birthYear}-01-01`;

    await this.page.getByTestId('template-birthdate-input').fill(birthDate);

    if (options.gender) {
      await this.page
        .getByTestId('template-gender-select')
        .selectOption(options.gender);
    }

    // Save the template using the correct test ID
    await this.page.getByTestId('template-save-button').click();

    // Wait for save to complete and form to disappear
    await this.page.waitForSelector('[data-testid="template-name-input"]', {
      state: 'detached',
      timeout: 5000,
    });

    // Wait for network to settle after save
    await this.page.waitForLoadState('networkidle');

    // Additional wait to allow Redux state updates to complete
    await this.page.waitForTimeout(2000);

    // Verify we're back on the management page by checking for the add button
    await this.page.waitForSelector('[data-testid="add-template-button"]', {
      timeout: 5000,
    });
  }

  /**
   * Verify person template exists in the management page
   */
  async expectPersonTemplateExists(name: string) {
    await this.gotoPeopleManagement();

    // Use the new test ID for reliable verification
    const templateNameSlug = name.toLowerCase().replace(/\s+/g, '-');
    const templateCard = this.page.getByTestId(
      `template-card-${templateNameSlug}`
    );
    await expect(templateCard).toBeVisible({ timeout: 10000 });

    // Also verify the template badge is present within the card
    const templateBadge = templateCard
      .locator('span.badge')
      .getByText('Template');
    await expect(templateBadge).toBeVisible();
  }

  /**
   * Edit a person template
   */
  async editPersonTemplate(
    currentName: string,
    newData: { name?: string; age?: number; gender?: string }
  ) {
    await this.gotoPeopleManagement();

    // Use the new test ID for reliable editing
    const templateNameSlug = currentName.toLowerCase().replace(/\s+/g, '-');
    const editButton = this.page.getByTestId(
      `edit-template-${templateNameSlug}-button`
    );
    await editButton.click();

    // Wait for the edit form to appear
    await this.page.waitForSelector('[data-testid="template-name-input"]', {
      timeout: 5000,
    });

    // Fill the form fields
    if (newData.name) {
      const nameInput = this.page.getByTestId('template-name-input');
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    if (newData.age !== undefined) {
      // Convert age to birth date
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - newData.age;
      const birthDate = `${birthYear}-01-01`;

      const birthDateInput = this.page.getByTestId('template-birthdate-input');
      await birthDateInput.fill(birthDate);
    }

    if (newData.gender) {
      const genderSelect = this.page.getByTestId('template-gender-select');
      await genderSelect.selectOption(newData.gender);
    }

    // Save the changes
    await this.page.getByTestId('template-save-button').click();

    // Wait for save to complete
    await this.page.waitForSelector('[data-testid="template-name-input"]', {
      state: 'detached',
      timeout: 5000,
    });

    // Wait for network to settle after save
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete a person template
   */
  async deletePersonTemplate(name: string) {
    await this.gotoPeopleManagement();

    // Use the new test ID for reliable deletion
    const templateNameSlug = name.toLowerCase().replace(/\s+/g, '-');
    const deleteButton = this.page.getByTestId(
      `delete-template-${templateNameSlug}-button`
    );

    // Set up dialog handler before clicking - use once() to avoid multiple handlers
    this.page.once('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        try {
          await dialog.accept();
        } catch {
          //
        }
      }
    });

    await deleteButton.click();

    // Wait for template card to be removed from DOM
    const templateCard = this.page.getByTestId(
      `template-card-${templateNameSlug}`
    );
    await expect(templateCard).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify that profile auto-appears in new trip
   */
  async expectProfileInTripPeople(tripPeoplePage: any, profileName: string) {
    await tripPeoplePage.goto();

    // Look for the profile name
    await expect(this.page.getByText(profileName)).toBeVisible();

    // Look for the "You" indicator that shows it's the user's profile
    await expect(this.page.getByText('You')).toBeVisible();
  }

  /**
   * Use person template when adding people to trip
   */
  async addPersonFromTemplate(templateName: string) {
    // Assume we're already on trip people page
    await this.page.getByRole('button', { name: 'Add Person' }).click();

    // Type the template name to trigger autocomplete
    const nameInput = this.page.getByTestId('person-name-input');
    await nameInput.fill(templateName.substring(0, 3)); // Type partial name

    // Wait for the dropdown to appear and find the template suggestion
    await this.page.waitForSelector('.absolute.z-50', { timeout: 5000 });

    // Find and click the template suggestion button
    const templateSuggestion = this.page
      .locator('button', {
        hasText: templateName,
      })
      .first();
    await templateSuggestion.waitFor({ state: 'visible', timeout: 5000 });
    await templateSuggestion.click();

    // Save the person
    await this.page.getByTestId('save-person-button').click();
  }

  /**
   * Save a trip person as a template
   */
  async savePersonAsTemplate(personName: string) {
    // Find the person card and use save as template option
    const personCard = this.page.getByTestId(
      `person-card-${personName.toLowerCase().replace(/\s+/g, '-')}`
    );
    const menuButton = personCard.getByTestId('person-menu-button');
    await menuButton.click();

    const saveAsTemplateButton = this.page.getByTestId(
      'save-as-template-button'
    );
    await saveAsTemplateButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveAsTemplateButton.click();

    // Wait for save to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify template suggestions appear when typing
   */
  async expectTemplateSuggestions(
    partialName: string,
    expectedTemplates: string[]
  ) {
    await this.page.getByRole('button', { name: 'Add Person' }).click();

    // Type partial name in the name input
    const nameInput = this.page.getByTestId('person-name-input');
    await nameInput.fill(partialName);

    // Wait for the dropdown to appear
    await this.page.waitForSelector('.absolute.z-50', { timeout: 5000 });

    // Should show template suggestions in the dropdown
    for (const template of expectedTemplates) {
      const templateButton = this.page.locator('button', { hasText: template });
      await expect(templateButton).toBeVisible();
    }
  }

  /**
   * Clear all person templates for cleanup
   */
  async clearAllPersonTemplates() {
    try {
      await this.gotoPeopleManagement();
    } catch (error) {
      // If we can't get to people management, there might be no templates
      console.log(
        'Could not navigate to people management, skipping template cleanup'
      );
      return;
    }

    // Remove any existing dialog handlers first
    this.page.removeAllListeners('dialog');

    // Set up dialog handler for confirmations
    this.page.once('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    // Quick check - if no templates exist, skip cleanup
    const templatesHeading = this.page.locator('text=/Templates \\((\\d+)\\)/');
    const headingExists = await templatesHeading.isVisible().catch(() => false);

    if (!headingExists) {
      return;
    }

    // Get initial count
    let templateCount = await this.getPersonTemplatesCount();
    if (templateCount === 0) {
      return;
    }

    // Keep deleting templates until none are left
    let attempts = 0;
    const maxAttempts = Math.min(templateCount + 2, 10); // Cap attempts based on initial count

    while (templateCount > 0 && attempts < maxAttempts) {
      attempts++;

      try {
        // Find all delete buttons with our test ID pattern
        const deleteButtons = this.page.locator(
          '[data-testid*="delete-template-"][data-testid$="-button"]'
        );
        const buttonCount = await deleteButtons.count();

        if (buttonCount > 0) {
          // Click the first delete button
          await deleteButtons.first().click();

          // Wait for deletion to process and UI to update
          await this.page.waitForTimeout(1000);

          // Wait for network activity to settle (deletion + reload)
          await this.page.waitForLoadState('networkidle', { timeout: 5000 });

          // Re-check count more efficiently
          const newCount = await this.getPersonTemplatesCount();
          if (newCount >= templateCount) {
            // Count didn't decrease, something went wrong
            console.log(
              `Template count didn't decrease: ${templateCount} -> ${newCount}`
            );
            break;
          }
          templateCount = newCount;
        } else {
          break; // No more delete buttons found
        }
      } catch (error) {
        console.log(
          `Error during template deletion attempt ${attempts}:`,
          error
        );
        break;
      }
    }
  }

  /**
   * Verify profile cannot be deleted (only edited)
   */
  async expectProfileCannotBeDeleted() {
    await this.gotoProfile();

    // Profile form should be visible (can be edited)
    await expect(this.page.locator('form')).toBeVisible();
    await expect(
      this.page.locator('input[placeholder="Enter your name"]')
    ).toBeVisible();

    // Should not have any delete button
    await expect(
      this.page.getByTestId('delete-profile-button')
    ).not.toBeVisible();
    await expect(
      this.page.locator('button:has-text("Delete")')
    ).not.toBeVisible();
  }

  /**
   * Get count of person templates
   */
  async getPersonTemplatesCount(): Promise<number> {
    await this.gotoPeopleManagement();

    // Look for the templates count in the "Templates (N)" heading
    const templatesHeading = this.page.locator('text=/Templates \\((\\d+)\\)/');
    const headingText = await templatesHeading.textContent();

    if (headingText) {
      const match = headingText.match(/Templates \((\d+)\)/);
      return match ? parseInt(match[1]) : 0;
    }

    return 0;
  }
}
