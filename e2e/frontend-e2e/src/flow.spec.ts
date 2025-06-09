import { test } from '@playwright/test';
import { PackingListPage } from './page-objects/PackingListPage';
import { PackingRulesPage } from './page-objects/PackingRulesPage';
import { TripCreationPage } from './page-objects/TripCreationPage';
import { TripWizardPage } from './page-objects/TripWizardPage';
import { FlowNavigationHelper } from './page-objects/FlowNavigationHelper';
import { PeoplePage } from './page-objects/PeoplePage';

test.describe('Trip Creation Flow', () => {
  let tripCreationPage: TripCreationPage;
  let tripWizardPage: TripWizardPage;
  let flowNavigation: FlowNavigationHelper;
  let packingRulesPage: PackingRulesPage;
  let packingListPage: PackingListPage;
  let peoplePage: PeoplePage;

  test.beforeEach(async ({ page }) => {
    tripCreationPage = new TripCreationPage(page);
    tripWizardPage = new TripWizardPage(page);
    flowNavigation = new FlowNavigationHelper(page);
    packingRulesPage = new PackingRulesPage(page);
    packingListPage = new PackingListPage(page);
    peoplePage = new PeoplePage(page);
  });

  test('should guide user through the complete trip creation flow', async () => {
    // Start at new trip page
    await tripCreationPage.goto();

    // Select vacation template
    await tripCreationPage.selectTemplate('vacation');

    // Fill in trip details
    const { startDate, endDate } = TripCreationPage.getTestDates();
    await tripCreationPage.fillTripDetails({
      title: 'Test Vacation',
      location: 'Hawaii',
      startDate,
      endDate,
    });

    // Submit and start wizard flow
    await tripCreationPage.submitTripDetails();

    // Should be on wizard page
    await tripWizardPage.verifyWizardPage();
    await tripWizardPage.navigateToReviewStep();

    // Check that initial events are populated
    await tripWizardPage.verifyInitialEvents('Hawaii');

    // Navigate to review step and save
    await tripWizardPage.navigateToReviewStep();
    await tripWizardPage.saveWizard();
    await peoplePage.verifyPeoplePage();

    // Add a person
    await peoplePage.addPerson('John Doe', 30, 'male');

    // Continue to rules
    await flowNavigation.continueToNextStep();
    await packingRulesPage.verifyPackingRulesPage();

    // Continue to packing list
    await flowNavigation.continueToNextStep();
    await packingListPage.verifyPackingListPage();
  });

  test('should allow back navigation in the flow', async () => {
    // Start at new trip page and create a trip
    await tripCreationPage.goto();
    await tripCreationPage.selectTemplate('vacation');
    await tripCreationPage.fillTripDetails({ title: 'Test Vacation' });
    await tripCreationPage.submitTripDetails();

    // Navigate through the flow
    await tripWizardPage.navigateToReviewStep();
    await tripWizardPage.saveWizard();
    await peoplePage.verifyPeoplePage();

    // Test back button to wizard
    await flowNavigation.navigateBack();
    await tripWizardPage.verifyWizardPage();

    // Go forward again
    await tripWizardPage.saveWizard();
    await peoplePage.verifyPeoplePage();

    // Continue to rules
    await flowNavigation.continueToNextStep();
    await packingRulesPage.verifyPackingRulesPage();

    // Test back button to people
    await flowNavigation.navigateBack();
    await peoplePage.verifyPeoplePage();
  });
});
