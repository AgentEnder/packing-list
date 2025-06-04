import { Page } from '@playwright/test';
import { RuleFormModal } from './RuleFormModal.js';
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
  readonly ruleFormModal: RuleFormModal;
  readonly rulePackModal: RulePackModal;

  constructor(protected page: Page) {
    this.ruleFormModal = new RuleFormModal(page);
    this.rulePackModal = new RulePackModal(page);
  }

  async goto() {
    // First dismiss any open modals
    await this.dismissAnyOpenModals();

    // Try to navigate to the defaults page
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
        // Try multiple methods to close the modal
        const closeSelectors = [
          '[data-testid="close-rule-form-modal"]',
          '[data-testid="rule-form-cancel-button"]',
          '[data-testid="close-modal-button"]',
          '[data-testid="cancel-button"]',
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
            await closeButton.click();
            // Check if modal is now closed
            if (!(await modal.isVisible())) {
              closed = true;
              break;
            }
          }
        }

        // If no close button worked, try pressing Escape
        if (!closed) {
          await this.page.keyboard.press('Escape');
        }

        // If still not closed, try clicking outside the modal
        if (await modal.isVisible()) {
          await this.page.click('body', { position: { x: 10, y: 10 } });
        }

        // Wait for modal to close (with timeout)
        try {
          await modal.waitFor({ state: 'hidden', timeout: 3000 });
        } catch {
          // Modal may still be visible, but continuing...
        }
      }
    } catch (error) {
      // Modal might not exist or already be closed, continue
    }
  }

  // Add Rule Button
  async clickAddRuleButton() {
    await this.page.getByTestId('add-rule-button').click();
    // Wait for modal to open
    await this.ruleFormModal.isVisible();
  }

  // Rule Management - Updated for modal approach
  async createRule({
    name,
    description,
    baseQuantity = 1,
    isPerDay = false,
    isPerPerson = false,
    everyNDays,
    extraItems = {
      quantity: 0,
    },
    conditions = [],
    categoryId = 'clothing', // Default category
  }: {
    name: string;
    description?: string;
    baseQuantity?: number;
    isPerDay?: boolean;
    isPerPerson?: boolean;
    everyNDays?: number;
    extraItems?: {
      quantity: number;
      perDay?: boolean;
      perPerson?: boolean;
      everyNDays?: number;
    };
    conditions?: RuleCondition[];
    categoryId?: string;
  }) {
    // Click add rule button to open modal
    await this.clickAddRuleButton();

    // Fill form using modal page object
    await this.ruleFormModal.fillBasicInfo(name, description);
    await this.ruleFormModal.setCategory(categoryId);
    await this.ruleFormModal.setBaseQuantity(baseQuantity);
    await this.ruleFormModal.setPerDay(isPerDay);
    await this.ruleFormModal.setPerPerson(isPerPerson);

    if (everyNDays !== undefined) {
      await this.ruleFormModal.setEveryNDays(true, everyNDays);
    }

    await this.ruleFormModal.setExtraItems(
      extraItems.quantity,
      extraItems.perDay,
      extraItems.perPerson,
      extraItems.everyNDays
    );

    for (const condition of conditions) {
      await this.ruleFormModal.addCondition(
        condition.type,
        condition.field,
        condition.operator,
        condition.value
      );
    }

    await this.ruleFormModal.save();

    // Wait for rule to appear in the list
    await this.page
      .getByRole('heading', { name })
      .waitFor({ state: 'visible', timeout: 10000 });

    // Give a moment for any state updates to complete
    await this.page.waitForTimeout(1000);
  }

  async editRule(
    ruleName: string,
    updates: Partial<Parameters<PackingRulesPage['createRule']>[0]>
  ) {
    // Find and click the edit button for the specific rule
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    await ruleCard.getByTestId('edit-rule-button').click();

    // Wait for modal to open
    await this.ruleFormModal.isVisible();

    // Update form fields
    if (updates.name) {
      await this.ruleFormModal.fillBasicInfo(updates.name, updates.description);
    }
    if (updates.categoryId) {
      await this.ruleFormModal.setCategory(updates.categoryId);
    }
    if (updates.baseQuantity !== undefined) {
      await this.ruleFormModal.setBaseQuantity(updates.baseQuantity);
    }
    if (updates.isPerDay !== undefined) {
      await this.ruleFormModal.setPerDay(updates.isPerDay);
    }
    if (updates.isPerPerson !== undefined) {
      await this.ruleFormModal.setPerPerson(updates.isPerPerson);
    }
    if (updates.everyNDays !== undefined) {
      await this.ruleFormModal.setEveryNDays(true, updates.everyNDays);
    }

    // Handle extra items if provided
    if (updates.extraItems) {
      await this.ruleFormModal.setExtraItems(
        updates.extraItems.quantity,
        updates.extraItems.perDay,
        updates.extraItems.perPerson,
        updates.extraItems.everyNDays
      );
    }

    // Handle conditions if provided
    if (updates.conditions) {
      // Clear existing conditions first
      const existingConditionCount =
        await this.ruleFormModal.getConditionCount();
      for (let i = existingConditionCount - 1; i >= 0; i--) {
        await this.ruleFormModal.removeCondition(i);
      }

      // Add new conditions
      for (const condition of updates.conditions) {
        await this.ruleFormModal.addCondition(
          condition.type,
          condition.field,
          condition.operator,
          condition.value
        );
      }
    }

    await this.ruleFormModal.save();

    // Wait for the updated rule to appear if the name was changed
    if (updates.name && updates.name !== ruleName) {
      await this.page
        .getByRole('heading', { name: updates.name })
        .waitFor({ state: 'visible', timeout: 10000 });

      // Give a moment for any state updates to complete
      await this.page.waitForTimeout(1000);
    } else {
      // Even if name didn't change, wait for the modal to close
      await this.page.waitForTimeout(1000);
    }
  }

  async deleteRule(ruleName: string) {
    // Find and click the delete button for the specific rule
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    await ruleCard.getByTestId('delete-rule-button').click();

    // Confirm deletion in the modal
    await this.page.getByTestId('confirm-delete-button').click();

    // Wait for the rule to disappear
    await this.page
      .locator(`[data-testid="rule-card"]:has-text("${ruleName}")`)
      .waitFor({ state: 'hidden', timeout: 10000 });

    // Give a moment for any state updates to complete
    await this.page.waitForTimeout(1000);
  }

  async getRuleCount() {
    return this.page.locator('[data-testid="rule-card"]').count();
  }

  async getRuleNames() {
    const ruleCards = this.page.locator('[data-testid="rule-card"]');
    const count = await ruleCards.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const heading = ruleCards.nth(i).locator('h3').first();
      const name = await heading.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  async getRuleCalculationDescription(ruleName: string) {
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    return ruleCard.getByTestId('rule-calculation-description').textContent();
  }

  async isRuleVisible(ruleName: string) {
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    return ruleCard.isVisible();
  }

  async getRuleConditionCount(ruleName: string) {
    const ruleCard = this.page.locator(
      `[data-testid="rule-card"]:has-text("${ruleName}")`
    );
    return ruleCard.locator('[data-testid^="rule-condition-"]').count();
  }

  // Rule Pack functionality remains the same
  async openRulePackModal() {
    await this.page.getByTestId('view-all-packs-button').click();
  }

  async closeRulePackModal() {
    try {
      const modal = this.page.locator('.modal.modal-open').first();
      if (await modal.isVisible()) {
        const closeSelectors = [
          '[data-testid="close-modal-button"]',
          '[data-testid="cancel-button"]',
          '[data-testid="rule-pack-cancel-button"]',
          '.modal-action .btn',
        ];

        let closed = false;
        for (const selector of closeSelectors) {
          const closeButton = modal.locator(selector).first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            if (!(await modal.isVisible())) {
              closed = true;
              break;
            }
          }
        }

        if (!closed) {
          await this.page.keyboard.press('Escape');
        }

        await modal.waitFor({ state: 'hidden', timeout: 3000 });
      }
    } catch (error) {
      console.error('Error closing rule pack modal:', error);
    }
  }

  async createRulePack(
    name: string,
    description: string,
    options: RulePackOptions = {}
  ) {
    await this.openRulePackModal();
    await this.rulePackModal.createPack(name, description, options);
  }
}
