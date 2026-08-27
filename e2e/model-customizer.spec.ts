import { test, expect } from '@playwright/test';

test.describe('3D Models Customizer & Exporter E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display brand identity and header consistent with vincentteo.com', async ({ page }) => {
    // Verify Brand title & 3D badge in header
    await expect(page.locator("header").locator("text=Vin's Space")).toBeVisible();
    await expect(page.locator("header").locator("text=3D Models")).toBeVisible();

    // Verify main nav links
    await expect(page.locator("a:has-text('Open Source')").first()).toBeVisible();
    await expect(page.locator("a:has-text('Games')").first()).toBeVisible();
    await expect(page.locator("a:has-text('Blog')").first()).toBeVisible();
    await expect(page.locator("a:has-text('Travel')").first()).toBeVisible();
    await expect(page.locator("a:has-text('Get in Touch')").first()).toBeVisible();
  });

  test('should display model catalog cards and allow switching models', async ({ page }) => {
    // Check available models
    await expect(page.locator("text=Parametric Desk Organizer").first()).toBeVisible();
    await expect(page.locator("text=Heavy-Duty Shelf Bracket").first()).toBeVisible();
    await expect(page.locator("text=PC Cable Management Comb").first()).toBeVisible();

    // Switch to Shelf Bracket
    await page.click("text=Heavy-Duty Shelf Bracket");

    // Verify parameter controls updated for Shelf Bracket
    await expect(page.locator("text=Shelf Depth (Arm)")).toBeVisible();
    await expect(page.locator("text=Wall Mount Height")).toBeVisible();
  });

  test('should render 3D WebGL viewport canvas with toolbar controls', async ({ page }) => {
    // Verify 3D canvas element is present and rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify viewport control buttons
    await expect(page.locator("button[title='Pause Rotation'], button[title='Auto-Rotate']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Wireframe']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Ground Grid']")).toBeVisible();
    await expect(page.locator("button[title='Reset Camera View']")).toBeVisible();
  });

  test('should detect dirty state when parameter is changed', async ({ page }) => {
    // Find number input for Length
    const lengthInput = page.locator("input[type='number']").first();
    await expect(lengthInput).toBeVisible();

    // Initial state: preview up-to-date
    const updateBtn = page.locator("button:has-text('Preview Up-to-Date'), button:has-text('Update 3D Preview')");
    await expect(updateBtn).toBeVisible();

    // Edit value
    await lengthInput.fill('160');

    // Should now indicate "Update 3D Preview"
    await expect(page.locator("button:has-text('Update 3D Preview')")).toBeVisible();
  });

  test('should open export modal and allow format selection', async ({ page }) => {
    // Click Export button
    await page.click("button:has-text('Export STL / STEP Files')");

    // Modal should be visible
    await expect(page.locator("text=Export Customized Model")).toBeVisible();
    await expect(page.locator("text=STL (3D Printing)")).toBeVisible();
    await expect(page.locator("text=STEP (CAD / CNC)")).toBeVisible();

    // Switch to STEP format tab
    await page.click("text=STEP (CAD / CNC)");
    await expect(page.locator("text=STEP Protocol")).toBeVisible();
    await expect(page.locator("button:has-text('Download STEP Model')")).toBeVisible();

    // Close modal
    await page.click("button[aria-label='Close dialog']");
    await expect(page.locator("text=Export Customized Model")).not.toBeVisible();
  });
});
