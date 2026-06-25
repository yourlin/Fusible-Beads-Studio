import { test, expect, type Page } from '@playwright/test';

/** 8×8 测试图：左半红、右半蓝（valid PNG）。 */
const FIXTURE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFklEQVR4nGN4pK0OR6rJr+GIYWhJAAD5iFThQ1aHewAAAABJRU5ErkJggg==';

function fixtureFile() {
  return {
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.from(FIXTURE_PNG_BASE64, 'base64'),
  };
}

/** 打开导入对话框、上传图片并点击生成，等待画布出现。 */
async function importAndGenerate(page: Page) {
  await page.goto('/studio');
  await page.getByTestId('import-btn').click();
  await page.locator('[data-testid="upload-input"]').setInputFiles(fixtureFile());
  await page.getByTestId('generate-btn').click();
  await expect(page.getByTestId('bead-canvas')).toBeVisible({ timeout: 20_000 });
}

test.describe('Pindou Studio 端到端', () => {
  test('导入 → 生成 → 显示网格与材料清单', async ({ page }) => {
    await importAndGenerate(page);
    await expect(page.getByTestId('bom-list')).toBeVisible();
  });

  test('编辑后可导出 PNG', async ({ page }) => {
    await importAndGenerate(page);

    const canvas = page.getByTestId('bead-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 10);
      await page.mouse.up();
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-png-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('可导出 PDF', async ({ page }) => {
    await importAndGenerate(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf-btn').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
