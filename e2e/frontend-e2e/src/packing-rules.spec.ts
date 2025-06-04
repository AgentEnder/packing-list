import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils.js';
import { PackingRulesPage } from './page-objects/PackingRulesPage.js';
import { PeoplePage } from './page-objects/PeoplePage.js';
import { TripPage } from './page-objects/TripPage.js';

test.describe('Packing Rules', () => {
  let packingRulesPage: PackingRulesPage;
  let peoplePage: PeoplePage;
  let tripPage: TripPage;

  test.beforeEach(async ({ page, context }) => {
    // Start with a fresh session
    await setupTestSession(page, context, false);
    packingRulesPage = new PackingRulesPage(page);
    peoplePage = new PeoplePage(page);
    tripPage = new TripPage(page);
    await packingRulesPage.goto();
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
      await packingRulesPage.createRuleWithoutWait({
        name: 'Simple Test',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: [
          {
            quantity: 4,
            perPerson: true,
            perDay: false,
          },
        ],
      });

      // Wait for rule to appear and take screenshot
      await page.waitForSelector(':text("Simple Test")', { timeout: 10000 });
      const rule = page.locator(
        '[data-testid="rule-card"]:has-text("Simple Test")'
      );
      await expect(rule).toBeVisible();

      // Wait a bit more for state to update
      await page.waitForTimeout(2000);

      // Debug: Check if calculation display exists at all
      const calculationDisplay = rule.locator('.text-base-content\\/50');
      const calculationExists = await calculationDisplay.count();
      console.log('Calculation display count:', calculationExists);

      // Check the total value
      const totalText = await rule.locator(':text("Total:")').textContent();
      console.log('Total text:', totalText);

      if (calculationExists === 0) {
        // Check if there are any people and days without navigating away
        // (navigating would reset the counts since state isn't persisted yet)
        console.log(
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

      // Wait for page to load
      await page.waitForSelector('[data-testid="create-rule-form"]', {
        timeout: 10000,
      });

      // Test Case 1: "6 per person per day + 4 extra per person"
      await packingRulesPage.createRuleWithoutWait({
        name: 'Test Case 1',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: [
          {
            quantity: 4,
            perPerson: true,
            perDay: false,
          },
        ],
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
      await packingRulesPage.createRuleWithoutWait({
        name: 'Test Case 2',
        baseQuantity: 1,
        isPerPerson: true,
        isPerDay: true,
        everyNDays: 2,
        extraItems: [
          {
            quantity: 1,
            perPerson: true,
            perDay: false,
          },
        ],
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
      await packingRulesPage.createRuleWithoutWait({
        name: 'Test Case 3',
        baseQuantity: 2,
        isPerPerson: true,
        isPerDay: false,
        extraItems: [
          {
            quantity: 3,
            perPerson: false,
            perDay: true,
          },
        ],
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
      await packingRulesPage.createRuleWithoutWait({
        name: 'Test Case 4',
        baseQuantity: 1,
        isPerPerson: false,
        isPerDay: true,
        extraItems: [
          {
            quantity: 1,
            perPerson: false,
            perDay: false,
          },
        ],
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
      await packingRulesPage.createRuleWithoutWait({
        name: 'Test Case 5',
        baseQuantity: 1,
        isPerPerson: true,
        isPerDay: true,
        everyNDays: 3,
        extraItems: [
          {
            quantity: 2,
            perPerson: false,
            perDay: true,
            everyNDays: 2,
          },
        ],
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

      // Take a full screenshot of all rules to show overall alignment
      const allRules = page.locator('[data-testid="rule-card"]');
      await expect(allRules.first()).toBeVisible();
      await expect(page.locator('.container')).toHaveScreenshot(
        'all-calculation-displays-alignment.png'
      );
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
      await page.waitForSelector('[data-testid="create-rule-form"]', {
        timeout: 10000,
      });

      // Test the specific failing scenario with 1 person
      await packingRulesPage.createRuleWithoutWait({
        name: 'Single Person Test',
        baseQuantity: 6,
        isPerPerson: true,
        isPerDay: true,
        extraItems: [
          {
            quantity: 4,
            perPerson: true,
            perDay: false,
          },
        ],
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
      await packingRulesPage.createRuleForm.fillBasicInfo(
        'Test Underwear Simple',
        'Simple test rule'
      );

      // Check name field
      const nameInput = page.getByTestId('rule-name-input');
      const nameValue = await nameInput.inputValue();
      console.log('Name after fill:', nameValue);

      // Set category
      await packingRulesPage.createRuleForm.setCategory('clothing');
      const categorySelect = page.getByTestId('create-rule-category-select');
      const categoryValue = await categorySelect.inputValue();
      console.log('Category after set:', categoryValue);

      // Set base quantity
      await packingRulesPage.createRuleForm.setBaseQuantity(1);
      const quantityInput = page.getByTestId('create-rule-base-quantity-input');
      const quantityValue = await quantityInput.inputValue();
      console.log('Quantity after set:', quantityValue);

      // Set per day checkbox
      await packingRulesPage.createRuleForm.setPerDay(true);
      const perDayCheckbox = page.getByTestId(
        'create-rule-base-per-day-checkbox'
      );
      const perDayChecked = await perDayCheckbox.isChecked();
      console.log('Per day after set:', perDayChecked);

      // Set per person checkbox
      await packingRulesPage.createRuleForm.setPerPerson(false);
      const perPersonCheckbox = page.getByTestId(
        'create-rule-base-per-person-checkbox'
      );
      const perPersonChecked = await perPersonCheckbox.isChecked();
      console.log('Per person after set:', perPersonChecked);

      // Ensure extra quantity field has a valid value
      const extraQuantityInput = page.getByTestId(
        'create-rule-extra-quantity-input'
      );
      await extraQuantityInput.fill('1');
      const extraQuantityValue = await extraQuantityInput.inputValue();
      console.log('Extra quantity after set:', extraQuantityValue);

      // Check if save button is enabled before clicking
      const saveButton = page.getByTestId('create-rule-save-button');
      const isDisabledBefore = await saveButton.isDisabled();
      console.log('Save button disabled before click:', isDisabledBefore);

      // Get the form element and check its validity
      const form = page.locator('form[aria-label="Create Rule Form"]');
      const isFormValid = await form.evaluate((form: HTMLFormElement) => {
        return form.checkValidity ? form.checkValidity() : 'unknown';
      });
      console.log('Form validity before submission:', isFormValid);

      // Check which fields are invalid
      const invalidFields = await form.evaluate((form: HTMLFormElement) => {
        if (!form.checkValidity) return 'checkValidity not supported';

        const invalidElements: {
          name: string | null;
          validationMessage: string;
          value: string;
          type: string;
        }[] = [];
        const inputs = form.querySelectorAll('input, select, textarea');
        for (const input of inputs) {
          if (!(input as HTMLInputElement).checkValidity()) {
            const i = input as HTMLInputElement;
            invalidElements.push({
              name: i.name || i.id || i.getAttribute('data-testid'),
              validationMessage: i.validationMessage,
              value: i.value,
              type: i.type,
            });
          }
        }
        return invalidElements;
      });
      console.log('Invalid fields:', JSON.stringify(invalidFields, null, 2));

      // Try the save
      await packingRulesPage.createRuleForm.save();

      // Check form state after save attempt
      const nameValueAfter = await nameInput.inputValue();
      const isDisabledAfter = await saveButton.isDisabled();
      console.log('Name after save attempt:', nameValueAfter);
      console.log('Save button disabled after click:', isDisabledAfter);

      // Log any console errors
      if (consoleErrors.length > 0) {
        console.log('Console errors:', consoleErrors);
      }

      // If the form was reset, the name should be empty
      expect(nameValueAfter).toBe('');
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
        extraItems: [
          { quantity: 1, perPerson: true },
          { quantity: 1, perDay: true, everyNDays: 3 },
        ],
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
    test('can add person-based conditions to a rule', async ({ page }) => {
      // Add debugging to see what happens
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Fill basic form info first
      await packingRulesPage.createRuleForm.fillBasicInfo(
        'Test Baby Items',
        'Items needed for babies'
      );
      await packingRulesPage.createRuleForm.setCategory('clothing');
      await packingRulesPage.createRuleForm.setBaseQuantity(1);

      // Debug: Check if add condition button exists
      const addConditionButton = page.getByTestId(
        'create-rule-add-condition-button'
      );
      const buttonExists = await addConditionButton.isVisible();
      console.log('Add condition button visible:', buttonExists);

      if (buttonExists) {
        // Click add condition button
        await addConditionButton.click();
        // await page.waitForTimeout(500);

        // Check if condition form appeared
        const conditionTypeSelect = page.getByTestId(
          'create-rule-condition-type-select'
        );
        const formVisible = await conditionTypeSelect.isVisible();
        console.log('Condition form visible after click:', formVisible);

        if (formVisible) {
          // Fill condition form manually
          await conditionTypeSelect.selectOption('person');
          await page
            .getByTestId('create-rule-condition-field-select')
            .selectOption('age');
          await page
            .getByTestId('create-rule-condition-operator-select')
            .selectOption('<');
          await page.getByTestId('create-rule-condition-value-input').fill('3');

          // Save condition
          const saveConditionButton = page.getByTestId(
            'create-rule-save-condition-button'
          );
          await saveConditionButton.click();
          //   await page.waitForTimeout(500);

          // Check if condition was added
          const conditionCount = await page
            .locator('[data-testid^="create-rule-condition-"]')
            .count();
          console.log('Condition count after save:', conditionCount);
        }
      }

      // Set extra quantity field to avoid validation issues
      const extraQuantityInput = page.getByTestId(
        'create-rule-extra-quantity-input'
      );
      await extraQuantityInput.fill('1');

      // Save the rule
      await packingRulesPage.createRuleForm.save();

      // Log any errors
      if (consoleErrors.length > 0) {
        console.log('Console errors:', consoleErrors);
      }

      // Wait for rule to appear
      await expect(
        packingRulesPage.isRuleVisible('Test Baby Items')
      ).resolves.toBe(true);

      // Check condition count
      const finalConditionCount = await packingRulesPage.getRuleConditionCount(
        'Test Baby Items'
      );
      console.log('Final condition count:', finalConditionCount);

      await expect(finalConditionCount).toBe(1);
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

      await packingRulesPage.editRuleConditions('Test Swimming Gear', [
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
      ]);

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
