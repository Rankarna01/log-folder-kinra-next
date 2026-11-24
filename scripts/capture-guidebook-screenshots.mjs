import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve(process.cwd(), 'report/screenshots');
const BASE_URL = 'https://timesheet-kinra.vercel.app';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 850, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Step 1: Login with NIK 2012 and password123
    console.log('Logging in as participant (NIK: 2012)...');
    await page.waitForSelector('input', { timeout: 10000 });
    const inputs = await page.$$('input');
    for (const inp of inputs) {
      const type = await page.evaluate(el => el.type, inp);
      const name = await page.evaluate(el => el.name || el.id, inp);
      if (type === 'text' || name === 'username' || name === 'email') {
        await inp.click({ clickCount: 3 });
        await inp.type('2012');
      } else if (type === 'password') {
        await inp.click({ clickCount: 3 });
        await inp.type('password123');
      }
    }

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();

    console.log('Waiting for navigation after login...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Current URL after login:', page.url());

    // 1. Screenshot Logbook page (Calendar view)
    console.log('Navigating to /logbook...');
    await page.goto(`${BASE_URL}/logbook`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '01-logbook-kalender.png') });
    console.log('Captured 01-logbook-kalender.png');

    // 2. Open Logbook Modal
    console.log('Opening logbook modal...');
    // Find button with text 'Catat' or click a day cell in calendar
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const catat = btns.find(b => b.textContent && (b.textContent.includes('Catat') || b.textContent.includes('Tambah')));
      if (catat) {
        catat.click();
        return true;
      }
      // Click day 20 or today in calendar
      const day = document.querySelector('button[data-date], .calendar-day, td[role="gridcell"] button, div[role="button"]');
      if (day) {
        day.click();
        return true;
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, '02-logbook-modal.png') });
    console.log('Captured 02-logbook-modal.png');

    // 3. Screenshot Reports page (Weekly)
    console.log('Navigating to /reports...');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '03-reports-mingguan.png') });
    console.log('Captured 03-reports-mingguan.png');

    // 4. Click tab "Template"
    console.log('Clicking tab Template...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tplBtn = btns.find(b => b.textContent && b.textContent.trim().toLowerCase().includes('template'));
      if (tplBtn) tplBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, '04-reports-template-tab.png') });
    console.log('Captured 04-reports-template-tab.png');

    // 5. Open Template Editor (/reports/templates/new)
    console.log('Navigating to /reports/templates/new...');
    await page.goto(`${BASE_URL}/reports/templates/new`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '05-template-editor.png') });
    console.log('Captured 05-template-editor.png');

    // 6. Screenshot Report Sheet Preview
    console.log('Navigating back to /reports for Report Sheet preview...');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));
    const printArea = await page.$('#print-area');
    if (printArea) {
      await printArea.screenshot({ path: path.join(OUT_DIR, '06-report-sheet-preview.png') });
    } else {
      await page.screenshot({ path: path.join(OUT_DIR, '06-report-sheet-preview.png') });
    }
    console.log('Captured 06-report-sheet-preview.png');

    console.log('SUCCESS: All 6 screenshots captured!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
