import { test, expect } from '@playwright/test';
import modelsConfig from '../config/models.config.json';

test.describe('3D Models Customizer & Exporter Studio Layout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept catalog API for fast, deterministic E2E test execution
    await page.route('**/api/models*', async (route) => {
      const url = route.request().url();
      if (url.includes('/preview')) {
        await route.fulfill({
          status: 200,
          contentType: 'model/stl',
          body: Buffer.from('solid test\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid test')
        });
        return;
      }

      const includeHidden = url.includes('includeHidden=true');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: includeHidden ? modelsConfig : (modelsConfig as Array<{ hidden?: boolean }>).filter((m) => !m.hidden),
          mockMode: true
        })
      });
    });
    await page.goto('/');
  });

  test('should display minimalist header with logo and title', async ({ page }) => {
    // Verify compact header with Vin's Space 3D Models title
    await expect(page.locator("header").locator("text=Vin's Space 3D Models")).toBeVisible();
    await expect(page.locator("button[title='Open Model Catalog']")).toBeVisible();
  });

  test('should open left model pop-out drawer and select model', async ({ page }) => {
    // Open left model catalog drawer
    await page.click("button:has-text('Models')");

    // Drawer should appear with visible models and exclude hidden models
    await expect(page.locator("button:has-text('Kumiko Keychain')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Kumiko Keychain (Onshape)')")).not.toBeVisible();

    // Select Replicad model from pop-out drawer
    await page.click("button:has-text('Kumiko Keychain')");

    // Drawer closes and left sidebar shows parameters
    await expect(page.locator("text=Model Catalog")).not.toBeVisible();
    await expect(page.locator("text=Section Patterns (6 Wedges)")).toBeVisible();
    await expect(page.locator("text=Hexagon Radius")).toBeVisible();
  });

  test('should display external model repository links for Printables and QIDI Maker', async ({ page }) => {
    // Check links in left sidebar
    const printablesLink = page.locator("a[title='Open model page on Printables']");
    await expect(printablesLink).toBeVisible();
    await expect(printablesLink).toHaveAttribute(
      'href',
      'https://www.printables.com/model/1826573-simple-kumiko-inspired-keychain-customisable'
    );

    const qidiLink = page.locator("a[title='Open model page on QIDI Maker']");
    await expect(qidiLink).toBeVisible();
    await expect(qidiLink).toHaveAttribute(
      'href',
      'https://www.qidimaker.com/en/models/detail/2093595266801807362'
    );
  });

  test('should render full viewport 3D WebGL canvas with controls', async ({ page }) => {
    // Verify 3D canvas element fills viewport
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify viewport control buttons
    await expect(page.locator("button[title='Pause Rotation'], button[title='Auto-Rotate']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Wireframe']")).toBeVisible();
    await expect(page.locator("button[aria-label='Toggle part color studio']")).toBeVisible();
    await expect(page.locator("button[title='Toggle Ground Grid']")).toBeVisible();
    await expect(page.locator("button[title='Reset Camera View']")).toBeVisible();
  });

  test('should open Part Colors Studio and toggle theme palettes', async ({ page }) => {
    // Click Part Colors Palette button
    await page.click("button[aria-label='Toggle part color studio']");

    // Part Color Studio dialog should appear
    await expect(page.locator("text=Part Materials & Colors")).toBeVisible();
    await expect(page.locator("text=1-Click Theme Palettes")).toBeVisible();
    await expect(page.locator("button:has-text('Classic Kumiko')")).toBeVisible();
    await expect(page.locator("button:has-text('Cyberpunk Neon')")).toBeVisible();

    // Click Cyberpunk theme preset
    await page.click("button:has-text('Cyberpunk Neon')");

    // Close Part Color Studio
    await page.click("button[aria-label='Close part color studio']");
    await expect(page.locator("text=Part Materials & Colors")).not.toBeVisible();
  });

  test('should adjust parameter in left sidebar and detect dirty state', async ({ page }) => {
    // Select Ryuso pattern from master dropdown to trigger dirty state
    await page.selectOption('#all-sections-pattern-select', '2');

    // Should now indicate "Update 3D Preview" once initial geometry settles
    await expect(page.locator("button:has-text('Update 3D Preview')")).toBeVisible({ timeout: 15000 });
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

  test('should load model directly via clean path slug URL and synchronize address bar', async ({ page }) => {
    // Navigate directly using a path slug permalink
    await page.goto('/kumiko-pattern-keychain');

    // Should load the Kumiko Keychain model directly
    await expect(page.locator("aside").locator("text=Kumiko Keychain")).toBeVisible();
    await expect(page.locator("text=Section Patterns (6 Wedges)")).toBeVisible();

    // Verify address bar contains /kumiko-pattern-keychain
    expect(page.url()).toContain('/kumiko-pattern-keychain');
  });

  test('should load in-browser Replicad model directly via clean path slug URL', async ({ page }) => {
    // Navigate directly to the Replicad model slug
    await page.goto('/kumiko-keychain-replicad');

    // Should display Replicad model in sidebar
    await expect(page.locator("aside").locator("text=Kumiko Keychain").first()).toBeVisible();
    await expect(page.locator("text=Section Patterns (6 Wedges)")).toBeVisible();

    // Verify address bar contains /kumiko-keychain-replicad
    expect(page.url()).toContain('/kumiko-keychain-replicad');
  });
});
