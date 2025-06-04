import { Page } from '@playwright/test';
import { CreateRuleForm } from './CreateRuleForm.js';
import { RulePackModal } from './RulePackModal.js';

export interface RuleCondition {
  type: 'person' | 'day';
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface RulePackOptions {
  category?: string;
  tags?: string[];
  visibility?: 'private' | 'public';
  icon?: string;
  color?: string;
}

export class PackingRulesPage {
  readonly createRuleForm: CreateRuleForm;
  readonly rulePackModal: RulePackModal;

  constructor(protected page: Page) {
    this.createRuleForm = new CreateRuleForm(page);
    this.rulePackModal = new RulePackModal(page);
  }

  async goto() {
    // First dismiss any open modals
    await this.dismissAnyOpenModals();

    // Try to navigate to the defaults page
    // Method 1: Click the navigation link
    const defaultItemsLink = this.page.getByText('Default Items');

    // Wait for the link to be available and clickable
    await defaultItemsLink.waitFor({ state: 'visible', timeout: 10000 });

    // Dismiss modals again right before clicking
    await this.dismissAnyOpenModals();

    await defaultItemsLink.click();
  }

  async dismissAnyOpenModals() {
    try {
      // Check if there's an open modal and close it
      const modal = this.page.locator('.modal.modal-open').first();
      if (await modal.isVisible()) {
        console.log('Found open modal, attempting to close...');

        // Try multiple methods to close the modal
        const closeSelectors = [
          '[data-testid="close-modal-button"]',
          '[data-testid="cancel-button"]',
          '[data-testid="create-rule-discard-button"]',
          '[data-testid="rule-pack-cancel-button"]',
          '.btn-ghost:has-text("Cancel")',
          '.btn-ghost:has-text("Close")',
          '.btn:has(.w-5.h-5)', // Icon buttons like X
          '.modal-action .btn',
        ];

        let closed = false;
        for (const selector of closeSelectors) {
          const closeButton = modal.locator(selector).first();
          if (await closeButton.isVisible()) {
            console.log(`Clicking close button: ${selector}`);
            await closeButton.click();
            // await this.page.waitForTimeout(500);
            // Check if modal is now closed
            if (!(await modal.isVisible())) {
              closed = true;
              break;
            }
          }
        }

        // If no close button worked, try pressing Escape
        if (!closed) {
          console.log('No close button found, trying Escape key...');
          await this.page.keyboard.press('Escape');
          //   await this.page.waitForTimeout(500);
        }

        // If still not closed, try clicking outside the modal
        if (await modal.isVisible()) {
          console.log('Modal still open, trying to click outside...');
          await this.page.click('body', { position: { x: 10, y: 10 } });
          //   await this.page.waitForTimeout(500);
        }

        // Wait for modal to close (with timeout)
        try {
          await modal.waitFor({ state: 'hidden', timeout: 3000 });
          console.log('Modal successfully closed');
        } catch {
          console.log('Modal may still be visible, but continuing...');
        }
      }
    } catch (error) {
      // Modal might not exist or already be closed, continue
      console.log('No modal found or error dismissing modal:', error);
    }
  }

  // Rule Management
  async createRuleWithoutWait({
    name,
    description,
    baseQuantity = 1,
    isPerDay = false,
    isPerPerson = false,
    everyNDays,
    extraItems = [],
    conditions = [],
    categoryId = 'clothing', // Default category
  }: {
    name: string;
    description?: string;
    baseQuantity?: number;
    isPerDay?: boolean;
    isPerPerson?: boolean;
    everyNDays?: number;
    extraItems?: Array<{
      quantity: number;
      perDay?: boolean;
      perPerson?: boolean;
      everyNDays?: number;
    }>;
    conditions?: RuleCondition[];
    categoryId?: string;
  }) {
    await this.createRuleForm.fillBasicInfo(name, description);
    await this.createRuleForm.setCategory(categoryId);
    await this.createRuleForm.setBaseQuantity(baseQuantity);
    await this.createRuleForm.setPerDay(isPerDay);
    await this.createRuleForm.setPerPerson(isPerPerson);

    if (everyNDays !== undefined) {
      await this.createRuleForm.setEveryNDays(true, everyNDays);
    }

    for (const item of extraItems) {
      await this.createRuleForm.setExtraItems(
        item.quantity,
        item.perDay,
        item.perPerson,
        item.everyNDays
      );
    }

    for (const condition of conditions) {
      await this.createRuleForm.addCondition(
        condition.type,
        condition.field,
        condition.operator,
        condition.value
      );
    }

    await this.createRuleForm.save();
    // Don't wait for rule to appear, just return
  }

  async createRule({
    name,
    description,
    baseQuantity = 1,
    isPerDay = false,
    isPerPerson = false,
    everyNDays,
    extraItems = [],
    conditions = [],
    categoryId = 'clothing', // Default category
  }: {
    name: string;
    description?: string;
    baseQuantity?: number;
    isPerDay?: boolean;
    isPerPerson?: boolean;
    everyNDays?: number;
    extraItems?: Array<{
      quantity: number;
      perDay?: boolean;
      perPerson?: boolean;
      everyNDays?: number;
    }>;
    conditions?: RuleCondition[];
    categoryId?: string;
  }) {
    await this.createRuleWithoutWait({
      name,
      description,
      baseQuantity,
      isPerDay,
      isPerPerson,
      everyNDays,
      extraItems,
      conditions,
      categoryId,
    });

    // Wait for the rule to appear by looking for the rule heading specifically
    await this.page
      .getByRole('heading', { name: name })
      .waitFor({ state: 'visible', timeout: 5000 });

    // Give a moment for any state updates to complete
    await this.page.waitForTimeout(1000);
  }

  async editRule(
    ruleName: string,
    updates: Parameters<PackingRulesPage['createRule']>[0]
  ) {
    // Find and click the edit button for the specific rule
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    await ruleCard.getByTestId('edit-rule-button').click();

    // Wait for the edit form to be visible
    await this.page.waitForSelector('[data-testid="edit-rule-save-button"]', {
      timeout: 10000,
    });

    // Get the save button reference before making any changes
    // This ensures we can still find it even if the rule name changes
    const saveButton = this.page.getByTestId('edit-rule-save-button');

    // Update the rule using the edit form (note: edit form uses different test IDs)
    if (updates.name) {
      await this.page.getByTestId('edit-rule-name-input').fill(updates.name);
    }
    if (updates.description) {
      await this.page
        .getByTestId('edit-rule-notes-input')
        .fill(updates.description);
    }
    if (updates.categoryId) {
      await this.page
        .getByTestId('edit-rule-category-select')
        .selectOption(updates.categoryId);
    }
    if (updates.baseQuantity !== undefined) {
      await this.page
        .getByTestId('edit-rule-base-quantity-input')
        .fill(updates.baseQuantity.toString());
    }
    if (updates.isPerDay !== undefined) {
      const checkbox = this.page.getByTestId('edit-rule-base-per-day-checkbox');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== updates.isPerDay) {
        await checkbox.click();
      }
    }
    if (updates.isPerPerson !== undefined) {
      const checkbox = this.page.getByTestId(
        'edit-rule-base-per-person-checkbox'
      );
      const isChecked = await checkbox.isChecked();
      if (isChecked !== updates.isPerPerson) {
        await checkbox.click();
      }
    }

    // Use the save button reference we captured earlier
    await saveButton.click();

    // Wait for the updated rule to appear if the name was changed
    if (updates.name && updates.name !== ruleName) {
      await this.page
        .getByRole('heading', { name: updates.name })
        .waitFor({ state: 'visible', timeout: 10000 });

      // Give a moment for any state updates to complete
      await this.page.waitForTimeout(1000);
    } else {
      // Even if name didn't change, wait for the edit form to close
      await this.page.waitForTimeout(1000);
    }
  }

  async deleteRule(ruleName: string) {
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    await ruleCard.getByTestId('delete-rule-button').click();

    // Wait for the delete confirmation modal to open
    const modal = this.page.locator('.modal.modal-open');
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // Find the confirm delete button in the modal (not in the rule card)
    const confirmButton = this.page.getByTestId('confirm-delete-button');
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await confirmButton.click();

    // Wait for the modal to close
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async getRuleCount() {
    return this.page.locator('[data-testid^="rule-item-"]').count();
  }

  async getRuleNames() {
    return this.page.getByTestId('rule-name').allTextContents();
  }

  async isRuleVisible(ruleName: string) {
    return this.page.getByRole('heading', { name: ruleName }).isVisible();
  }

  async getRuleConditionCount(ruleName: string) {
    // Find the rule card that contains the rule name and count its conditions
    const ruleCard = this.page
      .locator('[data-testid^="rule-item-"]')
      .filter({ hasText: ruleName });
    return ruleCard.locator('[data-testid^="rule-condition-"]').count();
  }

  async editRuleConditions(ruleName: string, conditions: RuleCondition[]) {
    // Find and click the edit button for the specific rule
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    await ruleCard.getByTestId('edit-rule-button').click();

    // Wait for the edit form to be visible
    await this.page.waitForSelector('[data-testid="edit-rule-save-button"]', {
      timeout: 10000,
    });

    // In edit mode, we need to look for existing conditions in the edit form context
    // Clear existing conditions by looking for remove buttons in the edit form
    const existingConditions = await this.page
      .locator('[data-testid^="edit-rule-condition-"]')
      .count();
    for (let i = existingConditions - 1; i >= 0; i--) {
      await this.createRuleForm.removeCondition(i, 'edit-rule-');
    }

    // Add new conditions one by one, waiting for each to be processed
    for (const condition of conditions) {
      await this.createRuleForm.addCondition(
        condition.type,
        condition.field,
        condition.operator,
        condition.value,
        'edit-rule-'
      );

      // Wait a moment for the condition to be added and form to reset
      await this.page.waitForTimeout(500);
    }

    await this.createRuleForm.save();
  }

  // Rule Pack Management
  async openRulePackModal() {
    // First, dismiss any existing modals that might be blocking
    await this.dismissAnyOpenModals();

    // Check if the rule pack modal is already open
    const rulePackModal = this.page.getByTestId('rule-pack-modal');
    if (await rulePackModal.isVisible()) {
      console.log('Rule pack modal already open, using existing modal');
      return;
    }

    // Click the button to open the modal
    await this.page.getByTestId('view-all-packs-button').click();

    // Wait for modal to be visible
    await this.page
      .getByTestId('rule-pack-modal')
      .waitFor({ state: 'visible', timeout: 10000 });

    console.log('Rule pack modal opened successfully');
  }

  async closeRulePackModal() {
    const rulePackModal = this.page.getByTestId('rule-pack-modal');
    if (!(await rulePackModal.isVisible())) {
      return; // Already closed
    }

    console.log('Closing rule pack modal...');

    // Try multiple ways to close the modal
    const closeSelectors = [
      '[data-testid="rule-pack-close-button"]',
      '[data-testid="rule-pack-cancel-button"]',
      '[data-testid="close-rule-pack-modal"]',
      '.modal-backdrop',
    ];

    let closed = false;
    for (const selector of closeSelectors) {
      const closeButton = rulePackModal.locator(selector).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await this.page.waitForTimeout(500);
        if (!(await rulePackModal.isVisible())) {
          closed = true;
          console.log(`Rule pack modal closed with: ${selector}`);
          break;
        }
      }
    }

    // If buttons didn't work, try Escape key
    if (!closed) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
      if (!(await rulePackModal.isVisible())) {
        closed = true;
        console.log('Rule pack modal closed with Escape');
      }
    }

    // If still not closed, click outside
    if (!closed) {
      await this.page.click('body', { position: { x: 10, y: 10 } });
      await this.page.waitForTimeout(500);
    }

    // Wait for modal to be hidden
    try {
      await rulePackModal.waitFor({ state: 'hidden', timeout: 3000 });
      console.log('Rule pack modal successfully closed');
    } catch {
      console.log('Warning: Rule pack modal may still be visible');
    }
  }

  async deleteRulePack(packName: string) {
    await this.openRulePackModal();
    // Wait for pack to be visible before trying to delete
    const packElement = this.page.getByTestId(`pack-${packName}`);
    await packElement.waitFor({ state: 'visible', timeout: 10000 });

    await this.page.getByTestId(`delete-pack-${packName}-button`).click();
    await this.page.getByTestId('confirm-delete-rule-packs-button').click();

    // Wait for pack to be removed
    await packElement.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
