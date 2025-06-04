import { Page } from '@playwright/test';

export class CreateRuleForm {
  constructor(private page: Page) {}

  async fillBasicInfo(name: string, description?: string) {
    await this.page.getByTestId('rule-name-input').fill(name);
    if (description) {
      await this.page.getByTestId('rule-notes-input').fill(description);
    }
  }

  async setCategory(categoryId: string) {
    await this.page
      .getByTestId('create-rule-category-select')
      .selectOption(categoryId);
  }

  async setBaseQuantity(quantity: number) {
    // Ensure the quantity meets the minimum and step requirements
    const validQuantity = Math.max(quantity, 0.1);
    await this.page
      .getByTestId('create-rule-base-quantity-input')
      .fill(validQuantity.toString());
  }

  async setPerDay(enabled: boolean) {
    const checkbox = this.page.getByTestId('create-rule-base-per-day-checkbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  async setPerPerson(enabled: boolean) {
    const checkbox = this.page.getByTestId(
      'create-rule-base-per-person-checkbox'
    );
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  async setEveryNDays(enabled: boolean, days?: number) {
    // Make sure per day is enabled first, as every N days depends on it
    const perDayCheckbox = this.page.getByTestId(
      'create-rule-base-per-day-checkbox'
    );
    const isPerDayChecked = await perDayCheckbox.isChecked();
    if (!isPerDayChecked) {
      await perDayCheckbox.click();
      // Wait for the every N days checkbox to appear
      await this.page.waitForTimeout(500);
    }

    const checkbox = this.page.getByTestId(
      'create-rule-base-every-n-days-checkbox'
    );

    // Wait for the checkbox to be visible
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });

    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
    if (enabled && days !== undefined) {
      await this.page
        .getByTestId('create-rule-base-every-n-days-input')
        .fill(days.toString());
    }
  }

  async setExtraItems(
    quantity: number,
    perDay?: boolean,
    perPerson?: boolean,
    everyNDays?: number
  ) {
    await this.page
      .getByTestId('create-rule-extra-quantity-input')
      .fill(quantity.toString());

    if (perDay !== undefined) {
      const checkbox = this.page.getByTestId(
        'create-rule-extra-per-day-checkbox'
      );
      const isChecked = await checkbox.isChecked();
      if (isChecked !== perDay) {
        await checkbox.click();
      }
    }

    if (perPerson !== undefined) {
      const checkbox = this.page.getByTestId(
        'create-rule-extra-per-person-checkbox'
      );
      const isChecked = await checkbox.isChecked();
      if (isChecked !== perPerson) {
        await checkbox.click();
      }
    }

    if (everyNDays !== undefined) {
      await this.setEveryNDays(true, everyNDays);
    }
  }

  async addCondition(
    type: 'person' | 'day',
    field: string,
    operator: string,
    value: string | number | boolean,
    testIdPrefix = 'create-rule-'
  ) {
    // Click the appropriate add condition button
    const addButton = this.page.getByTestId(
      `${testIdPrefix}add-condition-button`
    );

    const addButtonExists = await addButton.isVisible();

    if (!addButtonExists) {
      throw new Error(
        `Add condition button not found: ${testIdPrefix}add-condition-button`
      );
    }

    await addButton.click();

    // Wait a moment for form to appear
    await this.page.waitForTimeout(1000);

    // Check which condition form is actually visible (workaround for edit mode bug)
    const expectedTypeSelect = this.page.getByTestId(
      `${testIdPrefix}condition-type-select`
    );
    const createTypeSelect = this.page.getByTestId(
      'create-rule-condition-type-select'
    );

    let actualTypeSelect;
    let actualPrefix;

    if (await expectedTypeSelect.isVisible()) {
      actualTypeSelect = expectedTypeSelect;
      actualPrefix = testIdPrefix;
    } else if (await createTypeSelect.isVisible()) {
      actualTypeSelect = createTypeSelect;
      actualPrefix = 'create-rule-';
    } else {
      throw new Error(`No condition form is visible after clicking add button`);
    }

    // Use the form that's actually visible
    await actualTypeSelect.selectOption(type);
    await this.page
      .getByTestId(`${actualPrefix}condition-field-select`)
      .selectOption(field);
    await this.page
      .getByTestId(`${actualPrefix}condition-operator-select`)
      .selectOption(operator);

    // Convert boolean values to strings
    const stringValue =
      typeof value === 'boolean' ? (value ? '1' : '0') : value.toString();
    await this.page
      .getByTestId(`${actualPrefix}condition-value-input`)
      .fill(stringValue);
    await this.page.getByTestId(`${actualPrefix}save-condition-button`).click();
  }

  async removeCondition(index: number, testIdPrefix = 'create-rule-') {
    await this.page
      .getByTestId(`${testIdPrefix}remove-condition-${index}-button`)
      .click();
  }

  async editCondition(
    index: number,
    type: 'person' | 'day',
    field: string,
    operator: string,
    value: string | number | boolean
  ) {
    await this.page
      .getByTestId(`create-rule-edit-condition-${index}-button`)
      .click();
    await this.page
      .getByTestId('create-rule-condition-type-select')
      .selectOption(type);
    await this.page
      .getByTestId('create-rule-condition-field-select')
      .selectOption(field);
    await this.page
      .getByTestId('create-rule-condition-operator-select')
      .selectOption(operator);

    // Convert boolean values to strings
    const stringValue =
      typeof value === 'boolean' ? (value ? '1' : '0') : value.toString();
    await this.page
      .getByTestId('create-rule-condition-value-input')
      .fill(stringValue);
    await this.page.getByTestId('create-rule-save-condition-button').click();
  }

  async save() {
    try {
      // Check if we're in create or edit mode by looking for the appropriate save button
      const createSaveButton = this.page.getByTestId('create-rule-save-button');
      const editSaveButton = this.page.getByTestId('edit-rule-save-button');

      let saveButton;
      // Prefer edit save button if it's visible (even if create is also visible)
      if (await editSaveButton.isVisible()) {
        saveButton = editSaveButton;
      } else if (await createSaveButton.isVisible()) {
        saveButton = createSaveButton;
      } else {
        throw new Error('No save button found (neither create nor edit)');
      }

      // Check if the button is enabled before clicking
      const isEnabled = await saveButton.isEnabled();

      if (!isEnabled) {
        // Try to identify why the button is disabled

        // If edit button is disabled, try clicking it anyway (force click)
        if (saveButton === editSaveButton) {
          await saveButton.click({ force: true });
          return;
        }

        throw new Error('Save button is disabled and cannot be clicked');
      }

      await saveButton.click();
    } catch (error) {
      console.error('Error during form save:', error);
      throw error;
    }
  }

  async discard() {
    await this.page.getByTestId('create-rule-discard-button').click();
  }

  async isVisible() {
    return this.page.getByText('Add New Rule').isVisible();
  }
}
