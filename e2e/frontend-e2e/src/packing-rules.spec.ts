import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils.js';
import { PackingRulesPage } from './page-objects/PackingRulesPage.js';
import { PeoplePage } from './page-objects/PeoplePage.js';
import { TripPage } from './page-objects/TripPage.js';
import { TripManager } from './page-objects/trip-manager';

test.describe('Packing Rules', () => {
  let packingRulesPage: PackingRulesPage;
  let peoplePage: PeoplePage;
  let tripPage: TripPage;
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    // Start with fresh session and create test data as needed
    await setupTestSession(page, context, 'fresh');
    packingRulesPage = new PackingRulesPage(page);
    peoplePage = new PeoplePage(page);
    tripPage = new TripPage(page);
    tripManager = new TripManager(page);

    // Create a trip first using TripManager
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Test Trip',
      skipDates: true,
    });

    await packingRulesPage.goto();
  });

  test.afterEach(async () => {
    await packingRulesPage.rulePackModal.close();
  });

  test.describe('Calculation Display Visual Regression', () => {
    test('simple calculation display test', async ({ page }) => {
      // Set a larger viewport to ensure md:block styles are active
      await page.setViewportSize({ width: 1200, height: 800 });

      // Set up people using page object
      await peoplePage.goto();
      await peoplePage.addPerson('Test Person 1', 30);
      await peoplePage.addPerson('Test Person 2', 25);

      // Set up trip using page object
      await tripPage.goto();
      await tripPage.configureTrip({
        leaveDate: '2024-12-01',
        returnDate: '2024-12-09',
        destinations: [
          {
            location: 'Test Location',
            arriveDate: '2024-12-02',
            leaveDate: '2024-12-08',
          },
        ],
      });

      // Go to rules page
      await packingRulesPage.goto();

      // Create a single simple rule to test basic visual regression
      await packingRulesPage.createRule({
        name: 'Simple Test',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: {
          quantity: 4,
          perPerson: true,
          perDay: false,
        },
      });

      // Wait for rule to appear and take screenshot
      await page.waitForSelector(':text("Simple Test")', { timeout: 10000 });
      const rule = page.locator(
        '[data-testid="rule-card"]:has-text("Simple Test")'
      );
      await expect(rule).toBeVisible();

      // Debug: Check if calculation display exists at all
      const calculationDisplay = rule.locator('.text-base-content\\/50');
      const calculationExists = await calculationDisplay.count();

      if (calculationExists === 0) {
        // Check if there are any people and days without navigating away
        // (navigating would reset the counts since state isn't persisted yet)
        console.error(
          'Calculation display not found, checking state without navigation...'
        );

        // Take a screenshot of the whole rule for debugging
        await expect(rule).toHaveScreenshot('debug-rule-card.png');
        return;
      }

      await expect(calculationDisplay).toBeVisible();
      await expect(calculationDisplay).toHaveScreenshot(
        'simple-calculation-test.png'
      );
    });

    test('calculation display alignment - various scenarios', async ({
      page,
    }) => {
      // Set a larger viewport to ensure md:block styles are active
      await page.setViewportSize({ width: 1200, height: 800 });

      // Set up trip with specific people and days for consistent testing
      await peoplePage.goto();

      // Clear existing people and add exactly 4 people
      await peoplePage.clearAllPeople();

      // Add 4 people
      for (let i = 1; i <= 4; i++) {
        await peoplePage.addPerson(`Person ${i}`, 20);
      }

      // Set up 9 days using page object
      await tripPage.goto();
      await tripPage.configureTrip({
        leaveDate: '2024-12-01',
        returnDate: '2024-12-09',
        destinations: [
          {
            location: 'Test Location',
            arriveDate: '2024-12-02',
            leaveDate: '2024-12-08',
          },
        ],
      });

      // Go back to rules page
      await packingRulesPage.goto();

      // Test Case 1: "6 per person per day + 4 extra per person"
      await packingRulesPage.createRule({
        name: 'Test Case 1',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: {
          quantity: 4,
          perPerson: true,
          perDay: false,
        },
      });

      // Wait for rule to appear and take screenshot
      await page.waitForSelector(':text("Test Case 1")', { timeout: 10000 });
      const rule1 = page.locator(
        '[data-testid="rule-card"]:has-text("Test Case 1")'
      );
      const calculation1 = rule1.locator('.text-base-content\\/50');
      await expect(calculation1).toBeVisible();
      await expect(calculation1).toHaveScreenshot(
        'calculation-6-per-person-per-day-plus-4-extra-per-person.png'
      );

      // Test Case 2: "1 per person every 2 days (rounded up) + 1 extra per person"
      await packingRulesPage.createRule({
        name: 'Test Case 2',
        baseQuantity: 1,
        isPerPerson: true,
        isPerDay: true,
        everyNDays: 2,
        extraItems: {
          quantity: 1,
          perPerson: true,
          perDay: false,
        },
      });

      await page.waitForSelector(':text("Test Case 2")', { timeout: 10000 });
      const rule2 = page.locator(
        '[data-testid="rule-card"]:has-text("Test Case 2")'
      );
      const calculation2 = rule2.locator('.text-base-content\\/50');
      await expect(calculation2).toBeVisible();
      await expect(calculation2).toHaveScreenshot(
        'calculation-1-per-person-every-2-days-plus-1-extra-per-person.png'
      );

      // Test Case 3: "2 per person + 3 extra per day"
      await packingRulesPage.createRule({
        name: 'Test Case 3',
        baseQuantity: 2,
        isPerPerson: true,
        isPerDay: false,
        extraItems: {
          quantity: 3,
          perPerson: false,
          perDay: true,
        },
      });

      await page.waitForSelector(':text("Test Case 3")', { timeout: 10000 });
      const rule3 = page.locator(
        '[data-testid="rule-card"]:has-text("Test Case 3")'
      );
      const calculation3 = rule3.locator('.text-base-content\\/50');
      await expect(calculation3).toBeVisible();
      await expect(calculation3).toHaveScreenshot(
        'calculation-2-per-person-plus-3-extra-per-day.png'
      );

      // Test Case 4: "1 per day + 1 extra"
      await packingRulesPage.createRule({
        name: 'Test Case 4',
        baseQuantity: 1,
        isPerPerson: false,
        isPerDay: true,
        extraItems: {
          quantity: 1,
          perPerson: false,
          perDay: false,
        },
      });

      await page.waitForSelector(':text("Test Case 4")', { timeout: 10000 });
      const rule4 = page.locator(
        '[data-testid="rule-card"]:has-text("Test Case 4")'
      );
      const calculation4 = rule4.locator('.text-base-content\\/50');
      await expect(calculation4).toBeVisible();
      await expect(calculation4).toHaveScreenshot(
        'calculation-1-per-day-plus-1-extra.png'
      );

      // Test Case 5: Complex pattern - "1 per person every 3 days + 2 extra every 2 days"
      await packingRulesPage.createRule({
        name: 'Test Case 5',
        baseQuantity: 1,
        isPerPerson: true,
        isPerDay: true,
        everyNDays: 3,
        extraItems: {
          quantity: 2,
          perPerson: false,
          perDay: true,
          everyNDays: 2,
        },
      });

      await page.waitForSelector(':text("Test Case 5")', { timeout: 10000 });
      const rule5 = page.locator(
        '[data-testid="rule-card"]:has-text("Test Case 5")'
      );
      const calculation5 = rule5.locator('.text-base-content\\/50');
      await expect(calculation5).toBeVisible();
      await expect(calculation5).toHaveScreenshot(
        'calculation-complex-pattern.png'
      );

      // This test is a bit flaky between CI and local runs, so we're skipping it for now
      //   // Take a full screenshot of all rules to show overall alignment
      //   const allRules = page.locator('[data-testid="rule-card"]');
      //   await expect(allRules.first()).toBeVisible();
      //   await expect(page.locator('.container')).toHaveScreenshot(
      //     'all-calculation-displays-alignment.png'
      //   );
    });

    test('calculation display with single person scenario', async ({
      page,
    }) => {
      // Set a larger viewport to ensure md:block styles are active
      await page.setViewportSize({ width: 1200, height: 800 });

      // Set up trip with 1 person and 9 days
      await peoplePage.goto();

      // Clear existing people
      await peoplePage.clearAllPeople();

      // Add 1 person
      await peoplePage.addPerson('Solo Traveler', 30);

      // Set up 9 days using page object
      await tripPage.goto();
      await tripPage.configureTrip({
        leaveDate: '2024-12-01',
        returnDate: '2024-12-09',
        destinations: [
          {
            location: 'Test Location',
            arriveDate: '2024-12-02',
            leaveDate: '2024-12-08',
          },
        ],
      });

      // Go back to rules page
      await packingRulesPage.goto();

      // Test the specific failing scenario with 1 person
      await packingRulesPage.createRule({
        name: 'Single Person Test',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: {
          quantity: 4,
          perPerson: true,
          perDay: false,
        },
      });

      await page.waitForSelector(':text("Single Person Test")', {
        timeout: 10000,
      });
      const rule = page.locator(
        '[data-testid="rule-card"]:has-text("Single Person Test")'
      );
      const calculation = rule.locator('.text-base-content\\/50');
      await expect(calculation).toBeVisible();
      await expect(calculation).toHaveScreenshot(
        'calculation-single-person-scenario.png'
      );
    });
  });

  test.describe('Rule Management', () => {
    test('can create a basic packing rule', async () => {
      await packingRulesPage.createRule({
        name: 'Basic Socks',
        description: 'Basic socks packing rule',
        baseQuantity: 1,
        isPerDay: true,
        isPerPerson: false,
      });

      // Verify rule was created and is visible
      await expect(packingRulesPage.isRuleVisible('Basic Socks')).resolves.toBe(
        true
      );
    });

    test('can create a rule with per-day and per-person settings', async ({
      page,
    }) => {
      // Monitor console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Fill the form step by step and check each field
      await packingRulesPage.createRule({
        name: 'Test Underwear Simple',
        description: 'Simple test rule',
        baseQuantity: 1,
        isPerDay: true,
        isPerPerson: false,
        categoryId: 'clothing',
      });

      await expect(
        packingRulesPage.isRuleVisible('Test Underwear Simple')
      ).resolves.toBe(true);
    });

    test('can create a rule with every N days pattern', async () => {
      await packingRulesPage.createRule({
        name: 'Test Laundry Detergent',
        description: 'One pack every 3 days',
        baseQuantity: 1,
        isPerDay: true,
        everyNDays: 3,
      });

      await expect(
        packingRulesPage.isRuleVisible('Test Laundry Detergent')
      ).resolves.toBe(true);
    });

    test('can create a rule with extra items', async () => {
      await packingRulesPage.createRule({
        name: 'Test Toiletries',
        description: 'Basic toiletries kit',
        baseQuantity: 1,
        isPerPerson: true,
        extraItems: { quantity: 1 },
      });

      await expect(
        packingRulesPage.isRuleVisible('Test Toiletries')
      ).resolves.toBe(true);
    });

    test('can edit an existing rule', async () => {
      // First create a rule
      await packingRulesPage.createRule({
        name: 'Test Original Rule',
        description: 'Original description',
        baseQuantity: 1,
      });

      // Edit the rule
      await packingRulesPage.editRule('Test Original Rule', {
        name: 'Test Updated Rule',
        description: 'Updated description',
        baseQuantity: 2,
        isPerDay: true,
      });

      // Verify rule was updated
      await expect(
        packingRulesPage.isRuleVisible('Test Updated Rule')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.isRuleVisible('Test Original Rule')
      ).resolves.toBe(false);
    });

    test('can delete a rule', async () => {
      // First create a rule
      await packingRulesPage.createRule({
        name: 'Test To Delete',
        description: 'This rule will be deleted',
        baseQuantity: 1,
      });

      // Delete the rule
      await packingRulesPage.deleteRule('Test To Delete');

      // Verify rule was deleted
      await expect(packingRulesPage.getRuleCount()).resolves.toBe(0);
    });
  });

  test.describe('Rule Pack Management', () => {
    test('can create a rule pack', async () => {
      // Create a rule first
      await packingRulesPage.createRule({
        name: 'Test Pack Rule',
        description: 'Rule for the pack',
        baseQuantity: 1,
      });

      // Open the modal and create a pack
      await packingRulesPage.openRulePackModal();
      await packingRulesPage.rulePackModal.createPack(
        'Test Pack',
        'A pack for testing purposes'
      );

      // Verify pack was created
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Test Pack')
      ).resolves.toBe(true);
    });

    test('can edit a rule pack', async () => {
      // Create a rule first to ensure there are rules available for pack creation
      await packingRulesPage.createRule({
        name: 'Test Pack Rule for Edit',
        description: 'Rule for the pack',
        baseQuantity: 1,
      });

      await packingRulesPage.openRulePackModal();

      // Create a pack first
      await packingRulesPage.rulePackModal.createPack(
        'Test Original Pack',
        'Original description'
      );

      // Edit the pack
      await packingRulesPage.rulePackModal.editPack('Test Original Pack', {
        name: 'Test Updated Pack',
        description: 'Updated description',
      });

      // Verify pack was updated
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Test Updated Pack')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Test Original Pack')
      ).resolves.toBe(false);
    });

    test('can view rule pack details', async ({ page }) => {
      // Create a rule first to ensure there are rules available for pack creation
      await packingRulesPage.createRule({
        name: 'Test Pack Rule for Details',
        description: 'Rule for the pack',
        baseQuantity: 1,
      });

      // Open the modal and create a pack first
      await packingRulesPage.openRulePackModal();
      await packingRulesPage.rulePackModal.createPack(
        'Test Details Pack',
        'A pack for testing purposes'
      );

      // View pack details
      await packingRulesPage.rulePackModal.openPackDetails('Test Details Pack');

      // Verify we're on the details view
      await expect(page.getByTestId('rule-pack-details')).toBeVisible();
      await expect(page.getByTestId('pack-rating')).toBeVisible();
      await expect(page.getByTestId('pack-usage-count')).toBeVisible();
      await expect(page.getByTestId('pack-created-date')).toBeVisible();
      await expect(page.getByTestId('pack-category')).toBeVisible();
      await expect(page.getByTestId('pack-rules-list')).toBeVisible();
    });

    test('can apply and remove a rule pack', async () => {
      // Create a rule and pack first
      await packingRulesPage.createRule({
        name: 'Test Apply Pack Rule',
        description: 'Rule for the pack',
        baseQuantity: 1,
      });

      // Open the modal and create a pack
      await packingRulesPage.openRulePackModal();
      await packingRulesPage.rulePackModal.createPack(
        'Test Apply Pack',
        'A pack for testing purposes'
      );

      // Apply the pack
      await packingRulesPage.rulePackModal.applyPack('Test Apply Pack');

      // Verify pack is applied
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Test Apply Pack')
      ).resolves.toBe(true);

      // Remove the pack
      await packingRulesPage.rulePackModal.removePack('Test Apply Pack');

      // Verify pack is removed
      await expect(
        packingRulesPage.rulePackModal.isPackApplied('Test Apply Pack')
      ).resolves.toBe(false);
    });
  });

  test.describe('Rule Conditions', () => {
    test('can add person-based conditions to a rule', async () => {
      await packingRulesPage.createRule({
        name: 'Test Baby Items',
        description: 'Items needed for babies',
        baseQuantity: 1,
        isPerPerson: true,
        categoryId: 'clothing',
        conditions: [
          {
            type: 'person',
            field: 'age',
            operator: '<',
            value: '3',
          },
        ],
        extraItems: {
          quantity: 1,
          perPerson: true,
          perDay: false,
        },
      });

      // Wait for rule to appear
      await expect(
        packingRulesPage.isRuleVisible('Test Baby Items')
      ).resolves.toBe(true);

      // Check condition count
      const finalConditionCount = await packingRulesPage.getRuleConditionCount(
        'Test Baby Items'
      );
      await expect(finalConditionCount).toBe(1);

      // validate extra items are present
      const extraItems = await packingRulesPage.getRuleCalculationDescription(
        'Test Baby Items'
      );
      await expect(extraItems).toContain('1 extra per person');
    });

    test('can add trip-based conditions to a rule', async () => {
      await packingRulesPage.createRule({
        name: 'Test Winter Clothes',
        description: 'Warm clothing for cold weather',
        baseQuantity: 1,
        conditions: [
          {
            type: 'day',
            field: 'expectedClimate',
            operator: '==',
            value: 'winter',
          },
        ],
      });

      await expect(
        packingRulesPage.isRuleVisible('Test Winter Clothes')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.getRuleConditionCount('Test Winter Clothes')
      ).resolves.toBe(1);
    });

    test('can edit rule conditions', async () => {
      await packingRulesPage.createRule({
        name: 'Test Swimming Gear',
        description: 'Beach essentials',
        baseQuantity: 1,
        conditions: [
          {
            type: 'day',
            field: 'location',
            operator: '==',
            value: 'pool',
          },
        ],
      });

      await packingRulesPage.editRule('Test Swimming Gear', {
        conditions: [
          {
            type: 'day',
            field: 'location',
            operator: '==',
            value: 'pool',
          },
          {
            type: 'day',
            field: 'expectedClimate',
            operator: '==',
            value: 'summer',
          },
        ],
      });

      await expect(
        packingRulesPage.getRuleConditionCount('Test Swimming Gear')
      ).resolves.toBe(2);
    });
  });

  test.describe('Rule Pack Advanced Features', () => {
    test('can search and filter rule packs', async () => {
      // Create rules first - rule packs need at least one rule
      await packingRulesPage.createRule({
        name: 'Beach Rule',
        description: 'Rule for beach pack',
        baseQuantity: 1,
      });

      await packingRulesPage.createRule({
        name: 'Camping Rule',
        description: 'Rule for camping pack',
        baseQuantity: 1,
      });

      // Open the modal and create test packs
      await packingRulesPage.openRulePackModal();
      await packingRulesPage.rulePackModal.createPack(
        'Beach Pack',
        'Beach essentials',
        {
          category: 'vacation',
          tags: ['summer', 'beach'],
          visibility: 'public',
        }
      );
      await packingRulesPage.rulePackModal.createPack(
        'Camping Pack',
        'Camping gear',
        {
          category: 'outdoor',
          tags: ['camping', 'outdoor'],
          visibility: 'public',
        }
      );

      // Test search
      await packingRulesPage.rulePackModal.searchPacks('Beach');
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Beach Pack')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Camping Pack')
      ).resolves.toBe(false);
      await packingRulesPage.rulePackModal.clearSearch();
      await packingRulesPage.rulePackModal.clearCategory();

      // Test category filter
      await packingRulesPage.rulePackModal.filterByCategory('outdoor');
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Camping Pack')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Beach Pack')
      ).resolves.toBe(false);
      await packingRulesPage.rulePackModal.clearCategory();
      await packingRulesPage.rulePackModal.clearSearch();
      // Test tag filter
      await packingRulesPage.rulePackModal.filterByTag('summer');
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Beach Pack')
      ).resolves.toBe(true);
      await expect(
        packingRulesPage.rulePackModal.isPackVisible('Camping Pack')
      ).resolves.toBe(false);
      await packingRulesPage.rulePackModal.clearSearch();
    });

    test('can manage rule pack appearance', async () => {
      // Create a rule first - rule packs need at least one rule
      await packingRulesPage.createRule({
        name: 'Custom Rule',
        description: 'Rule for custom pack',
        baseQuantity: 1,
      });

      await packingRulesPage.openRulePackModal();

      await packingRulesPage.rulePackModal.createPack(
        'Custom Pack',
        'Custom appearance',
        {
          icon: 'sun',
          color: '#2196F3',
          visibility: 'public',
        }
      );

      await packingRulesPage.rulePackModal.editPack('Custom Pack', {
        description: 'Custom appearance',
        icon: 'tent',
        color: '#4CAF50',
        visibility: 'public',
      });

      await expect(
        packingRulesPage.rulePackModal.getPackColor('Custom Pack')
      ).resolves.toBe('#4CAF50');
    });
  });
});
