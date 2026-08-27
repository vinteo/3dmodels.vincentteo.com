import { test, expect } from '@playwright/test';

test.describe('3D Models Customizer & Exporter Studio Layout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display minimalist header with logo and title', async ({ page }) => {
    // Verify compact header with Vin's Space 3D Models title
    await expect(page.locator("header").locator("text=Vin's Space 3D Models")).toBeVisible();
    await expect(page.locator("button[title='Open Model Catalog']")).toBeVisible();
  });

  test('should open left model pop-out drawer and switch models', async ({ page }) => {
    // Open left model catalog drawer
    await page.click("button:has-text('Models')");

    // Drawer should appear
    await expect(page.locator("text=Model Catalog")).toBeVisible();
    await expect(page.locator("button:has-text('Kumiko Woodcraft Pattern')")).toBeVisible();
    await expect(page.locator("button:has-text('Heavy-Duty Shelf Bracket')")).toBeVisible();

    // Select Shelf Bracket from pop-out drawer
    await page.click("button:has-text('Heavy-Duty Shelf Bracket')");

    // Drawer closes and left sidebar shows parameters for Shelf Bracket
    await expect(page.locator("text=Model Catalog")).not.toBeVisible();
    await expect(page.locator("text=Shelf Depth (Arm)")).toBeVisible();
    await expect(page.locator("text=Wall Mount Height")).toBeVisible();
  });

  test('should render full viewport 3D WebGL canvas with controls', async ({ page }) => {
    // Verify 3D canvas element fills viewport
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify viewport control buttons
    await expect(page.locator("button[title='Pause Rotation'], button[title='Auto-Rotate']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Wireframe']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Ground Grid']")).toBeVisible();
    await expect(page.locator("button[title='Reset Camera View']")).toBeVisible();
  });

  test('should adjust parameter in left sidebar and detect dirty state', async ({ page }) => {
    // Find number input for Hexagon Radius in left sidebar
    const radiusInput = page.locator("aside input[type='number']").first();
    await expect(radiusInput).toBeVisible();

    // Initial state: preview up-to-date
    const updateBtn = page.locator("button:has-text('Preview Up-to-Date'), button:has-text('Update 3D Preview')");
    await expect(updateBtn).toBeVisible();

    // Edit value
    await radiusInput.fill('28');

    // Should now indicate "Update 3D Preview"
    await expect(page.locator("button:has-text('Update 3D Preview')")).toBeVisible();
  });

  test('should open export modal and switch format tabs', async ({ page }) => {
    // Click Export button in left sidebar
    await page.click("aside button:has-text('Export STL / STEP Files')");

    // Modal should be visible
    await expect(page.locator("text=Export Customized Model")).toBeVisible();
    await expect(page.locator("text=STL (3D Printing)")).toBeVisible();
    await expect(page.locator("text=STEP (CAD / CNC)")).toBeVisible();

    // Switch to STEP tab
    await page.click("text=STEP (CAD / CNC)");
    await expect(page.locator("text=STEP Protocol")).toBeVisible();
    await expect(page.locator("button:has-text('Download STEP Model')")).toBeVisible();

    // Close modal
    await page.click("button[aria-label='Close dialog']");
    await expect(page.locator("text=Export Customized Model")).not.toBeVisible();
  });
});
