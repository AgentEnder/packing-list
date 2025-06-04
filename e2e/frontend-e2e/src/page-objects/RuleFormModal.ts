import { Page } from '@playwright/test';

export interface RuleCondition {
  type: 'person' | 'day';
  field: string;
  operator: string;
  value: string | number | boolean;
}

export class RuleFormModal {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    const modal = this.page.getByTestId('rule-form-modal');
    return modal.isVisible();
  }

  async isEditMode(): Promise<boolean> {
    const title = this.page.getByRole('heading', {
      name: /Edit Rule|Create New Rule/,
    });
    const titleText = await title.textContent();
    return titleText?.includes('Edit Rule') ?? false;
  }

  async fillBasicInfo(name: string, notes?: string) {
    await this.page.getByTestId('rule-form-name-input').fill(name);
    if (notes) {
      await this.page.getByTestId('rule-form-notes-input').fill(notes);
    }
  }

  async setCategory(categoryId: string, subcategoryId?: string) {
    // Select main category
    await this.page
      .getByTestId('rule-form-category-select')
      .selectOption(categoryId);

    // Select subcategory if provided
    if (subcategoryId) {
      await this.page
        .getByTestId('rule-form-subcategory-select')
        .selectOption(subcategoryId);
    }
  }

  async setBaseQuantity(quantity: number) {
    await this.page
      .getByTestId('rule-form-base-quantity-input')
      .fill(quantity.toString());
  }

  async setPerDay(enabled: boolean) {
    const checkbox = this.page.getByTestId('rule-form-base-per-day-checkbox');
    if ((await checkbox.isChecked()) !== enabled) {
      await checkbox.click();
    }
  }

  async setPerPerson(enabled: boolean) {
    const checkbox = this.page.getByTestId(
      'rule-form-base-per-person-checkbox'
    );
    if ((await checkbox.isChecked()) !== enabled) {
      await checkbox.click();
    }
  }

  async setEveryNDays(enabled: boolean, days?: number) {
    const everyNDaysCheckbox = this.page.getByTestId(
      'rule-form-base-every-n-days-checkbox'
    );
    if ((await everyNDaysCheckbox.isChecked()) !== enabled) {
      await everyNDaysCheckbox.click();
    }

    if (enabled && days !== undefined) {
      await this.page
        .getByTestId('rule-form-base-every-n-days-input')
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
      .getByTestId('rule-form-extra-quantity-input')
      .fill(quantity.toString());

    if (perDay !== undefined) {
      const checkbox = this.page.getByTestId(
        'rule-form-extra-per-day-checkbox'
      );
      if ((await checkbox.isChecked()) !== perDay) {
        await checkbox.click();
      }
    }

    if (perPerson !== undefined) {
      const checkbox = this.page.getByTestId(
        'rule-form-extra-per-person-checkbox'
      );
      if ((await checkbox.isChecked()) !== perPerson) {
        await checkbox.click();
      }
    }

    if (everyNDays !== undefined) {
      const everyNDaysCheckbox = this.page.getByTestId(
        'rule-form-extra-every-n-days-checkbox'
      );
      if (!(await everyNDaysCheckbox.isChecked())) {
        await everyNDaysCheckbox.click();
      }
      await this.page
        .getByTestId('rule-form-extra-every-n-days-input')
        .fill(everyNDays.toString());
    }
  }

  async addCondition(
    type: 'person' | 'day',
    field: string,
    operator: string,
    value: string | number | boolean,
    testIdPrefix = 'rule-form-'
  ) {
    // Click add condition button
    await this.page.getByTestId(`${testIdPrefix}add-condition-button`).click();

    // Fill condition form
    await this.page
      .getByTestId(`${testIdPrefix}condition-type-select`)
      .selectOption(type);
    await this.page
      .getByTestId(`${testIdPrefix}condition-field-select`)
      .selectOption(field);
    await this.page
      .getByTestId(`${testIdPrefix}condition-operator-select`)
      .selectOption(operator);

    if (typeof value === 'string') {
      await this.page
        .getByTestId(`${testIdPrefix}condition-value-input`)
        .fill(value);
    } else {
      await this.page
        .getByTestId(`${testIdPrefix}condition-value-input`)
        .fill(value.toString());
    }

    // Save condition
    await this.page.getByTestId(`${testIdPrefix}condition-save-button`).click();
  }

  async removeCondition(index: number, testIdPrefix = 'rule-form-') {
    await this.page
      .getByTestId(`${testIdPrefix}remove-condition-${index}-button`)
      .click();
  }

  async save() {
    await this.page.getByTestId('rule-form-save-button').click();
    await this.waitForClose();
  }

  async cancel() {
    await this.page.getByTestId('rule-form-cancel-button').click();
  }

  async close() {
    await this.page.getByTestId('close-rule-form-modal').click();
  }

  async discardChanges() {
    // If discard modal appears, confirm it
    const discardModal = this.page.getByTestId('discard-rule-modal');
    if (await discardModal.isVisible()) {
      await this.page.getByTestId('discard-confirm-button').click();
    }
  }

  private async waitForClose() {
    const modal = this.page.getByTestId('rule-form-modal');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async getConditionCount(testIdPrefix = 'rule-form-'): Promise<number> {
    return this.page
      .locator(
        `[data-testid^="${testIdPrefix}remove-condition-"][data-testid$="-button"]`
      )
      .count();
  }
}
