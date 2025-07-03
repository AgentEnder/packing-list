import { Page, expect } from '@playwright/test';
import { PackItemsModal } from './PackItemsModal';

export type ViewMode = 'by-day' | 'by-person';
export type FilterType = 'packed' | 'unpacked';

export interface PackingListItem {
  name: string;
  quantity: string;
  isPacked: boolean;
  isOverridden?: boolean;
  hasNotes?: boolean;
  category?: string;
}

export interface GroupInfo {
  title: string;
  type: 'day' | 'person' | 'general';
  items: PackingListItem[];
}

export class PackingListPage {
  readonly packItemsModal: PackItemsModal;

  constructor(public page: Page) {
    this.packItemsModal = new PackItemsModal(page);
  }

  async goto() {
    try {
      // First try clicking the link (works for desktop/larger screens)
      const packingListLink = this.page
        .getByRole('link', {
          name: 'Packing List',
        })
        .last();

      await packingListLink.click({ timeout: 2000 });
      await this.verifyPackingListPage();
    } finally {
      // ?
    }
  }

  async verifyPackingListPage() {
    await expect(this.page).toHaveURL('/packing-list');
    await expect(
      this.page.getByRole('heading', { name: 'Packing List', level: 1 })
    ).toBeVisible();
  }

  // View Mode Controls
  async setViewMode(mode: ViewMode) {
    const button =
      mode === 'by-day'
        ? this.page.getByTestId('view-mode-by-day')
        : this.page.getByTestId('view-mode-by-person');

    await button.click();
  }

  async getViewMode(): Promise<ViewMode> {
    const byDayActive = await this.page
      .getByTestId('view-mode-by-day')
      .evaluate((el) => el.classList.contains('btn-active'));
    return byDayActive ? 'by-day' : 'by-person';
  }

  // Filter Controls
  async toggleFilter(filter: FilterType) {
    const button =
      filter === 'packed'
        ? this.page.getByTestId('filter-packed')
        : this.page.getByTestId('filter-unpacked');

    await button.click();
  }

  async isFilterActive(filter: FilterType): Promise<boolean> {
    const button =
      filter === 'packed'
        ? this.page.getByTestId('filter-packed')
        : this.page.getByTestId('filter-unpacked');

    return button.evaluate((el) => el.classList.contains('btn-active'));
  }

  // Content Verification
  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.getByTestId('empty-state').isVisible();
  }

  async hasContent(): Promise<boolean> {
    const groups = await this.page.getByTestId('packing-group').count();
    return groups > 0;
  }

  // Groups
  async getGroupCount(): Promise<number> {
    return this.page.getByTestId('packing-group').count();
  }

  async getGroupTitles(): Promise<string[]> {
    const groups = this.page.getByTestId('packing-group');
    const titles: string[] = [];
    const count = await groups.count();

    for (let i = 0; i < count; i++) {
      const title = await groups
        .nth(i)
        .getByTestId('group-title')
        .textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async getGroupByTitle(title: string) {
    const groups = this.page.getByTestId('packing-group');
    const count = await groups.count();

    for (let i = 0; i < count; i++) {
      const group = groups.nth(i);
      const groupTitle = await group.getByTestId('group-title').textContent();
      if (groupTitle?.trim() === title) {
        return new PackingGroup(this.page, group);
      }
    }

    throw new Error(`Group with title "${title}" not found`);
  }

  // Items
  async getItemCount(): Promise<number> {
    return this.page.getByTestId('packing-item').count();
  }

  async getItemByName(name: string) {
    const items = this.page.getByTestId('packing-item');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const itemName = await item.getByTestId('item-name').textContent();
      if (itemName?.trim() === name) {
        return new PackingItem(this.page, item);
      }
    }

    throw new Error(`Item with name "${name}" not found`);
  }

  async getAllItems(): Promise<PackingItem[]> {
    const items = this.page.getByTestId('packing-item');
    const count = await items.count();
    const packingItems: PackingItem[] = [];

    for (let i = 0; i < count; i++) {
      packingItems.push(new PackingItem(this.page, items.nth(i)));
    }

    return packingItems;
  }

  // Categories
  async getCategoryCount(): Promise<number> {
    return this.page.getByTestId('category-section').count();
  }

  async getCategoryTitles(): Promise<string[]> {
    const categories = this.page.getByTestId('category-section');
    const titles: string[] = [];
    const count = await categories.count();

    for (let i = 0; i < count; i++) {
      const title = await categories
        .nth(i)
        .getByTestId('category-title')
        .textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  // Print functionality
  async clickPrintButton() {
    await this.page.getByTestId('print-button').click();
  }

  // Help functionality
  async isHelpVisible(): Promise<boolean> {
    return this.page.getByTestId('help-blurb').isVisible();
  }

  async dismissHelp() {
    const helpBlurb = this.page.getByTestId('help-blurb');
    if (await helpBlurb.isVisible()) {
      const dismissButton = helpBlurb.getByRole('button', {
        name: /dismiss|close/i,
      });
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
      }
    }
  }

  // Progress tracking
  async getTotalProgress(): Promise<{ packed: number; total: number }> {
    const items = await this.getAllItems();
    let packed = 0;
    let total = 0;

    for (const item of items) {
      const counts = await item.getCounts();
      packed += counts.packed;
      total += counts.total;
    }

    return { packed, total };
  }

  // Setup methods for specific test scenarios
  async getSetupLinks() {
    return {
      addDays: this.page.getByTestId('setup-add-days-link'),
      addPeople: this.page.getByTestId('setup-add-people-link'),
      addRules: this.page.getByTestId('setup-add-rules-link'),
    };
  }

  async isSetupComplete(): Promise<boolean> {
    const setupChecks = this.page.getByTestId('check');
    const count = await setupChecks.count();
    return count >= 3; // Days, people, and rules
  }

  // Helper method to dismiss any toast notifications that might interfere with tests
  async dismissToasts() {
    try {
      // Look for common toast selectors and dismiss them
      const toasts = this.page.locator('.toast, .alert, [role="alert"]');
      const count = await toasts.count();

      for (let i = 0; i < count; i++) {
        const toast = toasts.nth(i);
        if (await toast.isVisible()) {
          // Try to find a close button within the toast
          const closeButton = toast.locator('button').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          } else {
            // If no close button, try clicking the toast itself to dismiss
            await toast.click();
          }
        }
      }
    } catch {
      // Ignore errors if no toasts are found or they can't be dismissed
    }
  }
}

export class PackingGroup {
  constructor(
    private page: Page,
    private element: ReturnType<Page['locator']>
  ) {}

  async getTitle(): Promise<string> {
    const title = await this.element.getByTestId('group-title').textContent();
    return title?.trim() || '';
  }

  async getItemCount(): Promise<number> {
    return this.element.getByTestId('packing-item').count();
  }

  async getItems(): Promise<PackingItem[]> {
    const items = this.element.getByTestId('packing-item');
    const count = await items.count();
    const packingItems: PackingItem[] = [];

    for (let i = 0; i < count; i++) {
      packingItems.push(new PackingItem(this.page, items.nth(i)));
    }

    return packingItems;
  }

  async getCategoryCount(): Promise<number> {
    return this.element.getByTestId('category-section').count();
  }

  async getCategoryTitles(): Promise<string[]> {
    const categories = this.element.getByTestId('category-section');
    const titles: string[] = [];
    const count = await categories.count();

    for (let i = 0; i < count; i++) {
      const title = await categories
        .nth(i)
        .getByTestId('category-title')
        .textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }
}

export class PackingItem {
  constructor(
    private page: Page,
    private element: ReturnType<Page['locator']>
  ) {}

  async getName(): Promise<string> {
    const name = await this.element.getByTestId('item-name').textContent();
    return name?.trim() || '';
  }

  async getCounts(): Promise<{ packed: number; total: number }> {
    const countsText = await this.element
      .getByTestId('item-counts')
      .textContent();
    const match = countsText?.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        packed: parseInt(match[1]),
        total: parseInt(match[2]),
      };
    }
    return { packed: 0, total: 0 };
  }

  async getProgress(): Promise<number> {
    const counts = await this.getCounts();
    return counts.total > 0
      ? Math.round((counts.packed / counts.total) * 100)
      : 0;
  }

  async isCompletelyPacked(): Promise<boolean> {
    const counts = await this.getCounts();
    return counts.packed === counts.total && counts.total > 0;
  }

  async hasNotes(): Promise<boolean> {
    return this.element.getByTestId('info-icon').isVisible();
  }

  async isOverridden(): Promise<boolean> {
    return this.element.getByTestId('override-badge').isVisible();
  }

  async clickPackButton() {
    await this.element.getByTestId('pack-button').click();
  }

  async clickOverrideButton() {
    await this.element.getByTestId('item-name').click();
  }

  async getTooltipText(): Promise<string | null> {
    if (await this.hasNotes()) {
      // Hover over the info icon to reveal the tooltip
      await this.element.getByTestId('info-icon').hover();

      // Try to find the tooltip content within this specific element
      const tooltip = this.element.locator('.tooltip');
      if (await tooltip.isVisible()) {
        return tooltip.locator('.tooltip-content').textContent();
      }
    }
    return null;
  }
}
