import { type Page, expect, test } from '@playwright/test';
import _ from 'lodash';

async function extractIbanInfo({ page }: { page: Page }) {
  const tdHandles = await page.locator('table tr td').elementHandles();
  const tdTextContents = await Promise.all(tdHandles.map(el => el.textContent()));

  return _.chain(tdTextContents)
    .map(tdTextContent => tdTextContent?.trim().replace(' Copy to clipboard', ''))
    .chunk(2)
    .value();
}

test.describe('Tool - Iban validator and parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iban-validator-and-parser');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('IBAN validator and parser - IT Tools');
  });

  test('iban info are extracted from a valid iban', async ({ page }) => {
    await page.getByTestId('iban-input').fill('DE89370400440532013000');

    const ibanInfo = await extractIbanInfo({ page });

    expect(ibanInfo).toEqual([
      ['Is IBAN valid ?', 'Yes'],
      ['Is IBAN a QR-IBAN ?', 'No'],
      ['Country code', 'DE'],
      ['BBAN', '370400440532013000'],
      ['IBAN friendly format', 'DE89 3704 0044 0532 0130 00'],
    ]);
  });

  test('invalid iban errors are displayed', async ({ page }) => {
    await page.getByTestId('iban-input').fill('FR7630006060011234567890189');

    const ibanInfo = await extractIbanInfo({ page });

    expect(ibanInfo).toEqual([
      ['Is IBAN valid ?', 'No'],
      ['IBAN errors', 'Wrong account bank branch checksumWrong IBAN checksum Copy to clipboard'],
      ['Is IBAN a QR-IBAN ?', 'No'],
      ['Country code', 'N/A'],
      ['BBAN', 'N/A'],
      ['IBAN friendly format', 'FR76 3000 6060 0112 3456 7890 189'],
    ]);
  });
});
