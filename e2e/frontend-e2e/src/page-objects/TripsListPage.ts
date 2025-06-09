import { Page, expect } from '@playwright/test';

export class TripsListPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page
      .getByTestId(/trip-selector.*/)
      .filter({ visible: true })
      .first()
      .click();
  }

  // Navigation
  async clickNewTripButton() {
    await this.page.getByRole('link', { name: 'New Trip' }).click();
  }

  async clickCreateFirstTripLink() {
    await this.page.getByTestId('create-first-trip-link').click();
  }

  // Empty state checks
  async expectEmptyState() {
    await expect(this.page.getByText('No trips yet')).toBeVisible();
    await expect(
      this.page.getByText('Create your first trip to start planning')
    ).toBeVisible();
    await expect(this.page.getByTestId('create-first-trip-link')).toBeVisible();
  }

  async expectTripsGrid() {
    await expect(
      this.page.locator('.grid.gap-6.md\\:grid-cols-2.lg\\:grid-cols-3')
    ).toBeVisible();
  }

  // Trip card interactions
  async getTripCardCount() {
    return await this.page.locator('.card.bg-base-100').count();
  }

  async expectTripCard(tripIdentifier: string) {
    // Try to find by title first (most common case)
    let tripCard = this.page.locator(`.card:has-text("${tripIdentifier}")`);
    if ((await tripCard.count()) > 0) {
      await expect(tripCard).toBeVisible();
      return tripCard;
    }

    // Fallback to finding by trip menu test ID
    tripCard = this.page.locator(
      `.card:has([data-testid="trip-menu-${tripIdentifier}"])`
    );
    await expect(tripCard).toBeVisible();
    return tripCard;
  }

  async expectTripTitle(tripId: string, title: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(tripCard.locator('h3.card-title')).toContainText(title);
  }

  async expectTripDescription(tripId: string, description: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(tripCard.locator('p.text-sm')).toContainText(description);
  }

  async expectCurrentTripBadge(tripId: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(tripCard.locator('.badge.badge-primary')).toContainText(
      'Current'
    );
  }

  async expectTripStats(
    tripId: string,
    stats: { people: number; packedItems: number; totalItems: number }
  ) {
    const tripCard = await this.expectTripCard(tripId);

    // Check people count
    const peopleValue = tripCard
      .locator('.stat')
      .filter({ hasText: 'People' })
      .locator('.stat-value');
    await expect(peopleValue).toContainText(stats.people.toString());

    // Check packed items count
    const packedValue = tripCard
      .locator('.stat')
      .filter({ hasText: 'Packed' })
      .locator('.stat-value');
    await expect(packedValue).toContainText(
      `${stats.packedItems}/${stats.totalItems}`
    );
  }

  // Trip actions
  async selectTrip(tripId: string) {
    await this.page.getByTestId(`select-trip-${tripId}`).click();
  }

  async goToTrip(tripId: string) {
    await this.page.getByTestId(`go-to-trip-${tripId}`).click();
  }

  async openTripSettings(tripId: string) {
    await this.page.getByTestId(`trip-settings-${tripId}`).click();
  }

  // Trip menu actions
  async openTripMenu(tripId: string) {
    await this.page.getByTestId(`trip-menu-${tripId}`).click();
  }

  async editTripFromMenu(tripId: string) {
    await this.openTripMenu(tripId);
    await this.page.getByRole('link', { name: 'Edit' }).click();
  }

  async duplicateTrip(tripId: string) {
    await this.openTripMenu(tripId);
    await this.page.getByTestId(`duplicate-trip-${tripId}`).click();
  }

  async deleteTrip(tripId: string) {
    await this.openTripMenu(tripId);
    await this.page.getByTestId(`delete-trip-${tripId}`).click();
  }

  // Delete modal
  async expectDeleteModal() {
    await expect(this.page.locator('#modal-title')).toBeVisible();
    await expect(
      this.page.locator('text=Are you sure you want to delete').first()
    ).toBeVisible();
  }

  async confirmDeleteTrip() {
    await this.page.getByTestId('confirm-delete-trip').click();
  }

  async cancelDeleteTrip() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  // Trip card existence checks
  async expectTripExists(tripId: string) {
    await expect(this.page.getByTestId(`trip-menu-${tripId}`)).toBeVisible();
  }

  async expectTripNotExists(tripId: string) {
    await expect(
      this.page.getByTestId(`trip-menu-${tripId}`)
    ).not.toBeVisible();
  }

  // Page content checks
  async expectPageTitle() {
    await expect(
      this.page.getByRole('heading', { name: 'Trips', exact: true })
    ).toBeVisible();
  }

  async expectPageDescription() {
    await expect(
      this.page.getByText('Manage all your packing trips')
    ).toBeVisible();
  }

  // Trip card UI state checks
  async expectTripSelected(tripId: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(tripCard).toHaveClass(/border-primary/);
    await expect(this.page.getByTestId(`go-to-trip-${tripId}`)).toBeVisible();
    await expect(
      this.page.getByTestId(`select-trip-${tripId}`)
    ).not.toBeVisible();
  }

  async expectTripNotSelected(tripId: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(tripCard).not.toHaveClass(/border-primary/);
    await expect(this.page.getByTestId(`select-trip-${tripId}`)).toBeVisible();
    await expect(
      this.page.getByTestId(`go-to-trip-${tripId}`)
    ).not.toBeVisible();
  }

  // Date formatting checks
  async expectTripDates(tripId: string, createdAt: string, updatedAt?: string) {
    const tripCard = await this.expectTripCard(tripId);
    await expect(
      tripCard.locator('.text-xs.text-base-content\\/60')
    ).toContainText(`Created ${createdAt}`);

    if (updatedAt && updatedAt !== createdAt) {
      await expect(
        tripCard.locator('.text-xs.text-base-content\\/60')
      ).toContainText(`Updated ${updatedAt}`);
    }
  }

  // Helper to wait for trip card to appear after creation
  async waitForTripCard(tripId: string, timeout = 5000) {
    await this.page.waitForSelector(`[data-testid="trip-menu-${tripId}"]`, {
      timeout,
    });
  }

  // Helper to verify grid layout on different screen sizes
  async expectResponsiveGrid() {
    const grid = this.page.locator('.grid.gap-6');
    await expect(grid).toHaveClass(/md:grid-cols-2/);
    await expect(grid).toHaveClass(/lg:grid-cols-3/);
  }
}
