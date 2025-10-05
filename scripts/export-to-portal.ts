import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface LogbookEntry {
  tanggal: string; // Format: YYYY-MM-DD
  waktu_mulai: string; // Format: HH:mm
  waktu_selesai: string; // Format: HH:mm
  jenis_kegiatan: string; // "Berita Acara Pembimbingan", "Berita Acara Ujian", "Berita Acara Kegiatan"
  dosen_penggerak: string; // Nama dosen
  tipe_penyelenggaraan: 'hybrid' | 'offline' | 'online';
  lokasi: string;
  keterangan: string;
  bukti_path: string; // Path ke file bukti
}

interface PortalCredentials {
  username: string;
  password: string;
}

const PORTAL_URL = 'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka/Index/0ZBADtiezVxS5wU6DZ_i568np7ZMjxfXFrAMlOqd3O0';
const LOGIN_URL = 'https://studentportal.ipb.ac.id/Account/Login';

/**
 * Login ke student portal IPB
 */
async function login(page: Page, credentials: PortalCredentials): Promise<boolean> {
  try {
    console.log('🔐 Attempting to login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

    // Fill login form
    await page.fill('input[name="username"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/studentportal.ipb.ac.id/**', { timeout: 30000 });

    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error);
    return false;
  }
}

/**
 * Map jenis kegiatan ke ID yang sesuai dengan dropdown portal
 */
function mapJenisKegiatan(jenisKegiatan: string): string {
  const mapping: Record<string, string> = {
    'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)': '1',
    'Berita Acara Ujian': '2',
    'Berita Acara Kegiatan': '3'
  };

  return mapping[jenisKegiatan] || '3'; // Default to "Berita Acara Kegiatan"
}

/**
 * Map tipe penyelenggaraan ke radio button value
 */
function mapTipePenyelenggaraan(tipe: 'hybrid' | 'offline' | 'online'): string {
  const mapping: Record<string, string> = {
    'hybrid': 'Hybrid',
    'offline': 'Offline',
    'online': 'Online'
  };

  return mapping[tipe] || 'Offline';
}

/**
 * Export single logbook entry ke portal IPB
 */
async function exportLogbookEntry(
  page: Page,
  entry: LogbookEntry
): Promise<boolean> {
  try {
    console.log(`\n📝 Exporting logbook entry: ${entry.keterangan.substring(0, 50)}...`);

    // Navigate to logbook form
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle' });

    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill tanggal (date picker)
    console.log('   📅 Setting tanggal...');
    await page.fill('input[name="Tanggal"]', entry.tanggal);

    // Fill waktu mulai
    console.log('   ⏰ Setting waktu mulai...');
    await page.fill('input[name="WaktuMulai"]', entry.waktu_mulai);

    // Fill waktu selesai
    console.log('   ⏰ Setting waktu selesai...');
    await page.fill('input[name="WaktuSelesai"]', entry.waktu_selesai);

    // Select jenis kegiatan (dropdown)
    console.log('   📋 Setting jenis kegiatan...');
    const jenisKegiatanId = mapJenisKegiatan(entry.jenis_kegiatan);
    await page.selectOption('select[name="JenisLogbookKegiatanKampusMerdekaId"]', jenisKegiatanId);

    // Check dosen penggerak checkbox
    console.log('   👨‍🏫 Setting dosen penggerak...');
    // Find checkbox by label text or value
    const dosenCheckbox = await page.locator(`input[type="checkbox"][value*="${entry.dosen_penggerak}"]`).first();
    if (await dosenCheckbox.count() > 0) {
      await dosenCheckbox.check();
    } else {
      console.warn(`   ⚠️  Dosen "${entry.dosen_penggerak}" not found, skipping...`);
    }

    // Select tipe penyelenggaraan (radio button)
    console.log('   🏢 Setting tipe penyelenggaraan...');
    const tipeValue = mapTipePenyelenggaraan(entry.tipe_penyelenggaraan);
    await page.check(`input[name="IsLuring"][value="${tipeValue}"]`);

    // Fill lokasi
    console.log('   📍 Setting lokasi...');
    await page.fill('input[name="Lokasi"]', entry.lokasi);

    // Fill keterangan (textarea)
    console.log('   📝 Setting keterangan...');
    await page.fill('textarea[name="Keterangan"]', entry.keterangan);

    // Upload bukti file
    console.log('   📎 Uploading bukti...');
    const filePath = path.resolve(entry.bukti_path);

    if (fs.existsSync(filePath)) {
      const fileInput = await page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(filePath);
      console.log('   ✅ File uploaded successfully');
    } else {
      console.warn(`   ⚠️  File not found: ${filePath}`);
    }

    // Submit form
    console.log('   💾 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForTimeout(3000); // Wait for submission to complete

    // Check for success
    const currentUrl = page.url();
    if (currentUrl.includes('success') || currentUrl !== PORTAL_URL) {
      console.log('   ✅ Logbook entry exported successfully!');
      return true;
    } else {
      console.log('   ⚠️  Submission might have failed, check portal manually');
      return false;
    }

  } catch (error) {
    console.error('   ❌ Failed to export logbook entry:', error);
    return false;
  }
}

/**
 * Main export function
 */
export async function exportToPortal(
  credentials: PortalCredentials,
  entries: LogbookEntry[],
  options: {
    headless?: boolean;
    screenshotOnError?: boolean;
  } = {}
): Promise<{ success: number; failed: number }> {
  const { headless = false, screenshotOnError = true } = options;

  let browser: Browser | null = null;
  let successCount = 0;
  let failedCount = 0;

  try {
    console.log('🚀 Starting Playwright automation...\n');

    // Launch browser
    browser = await chromium.launch({
      headless,
      slowMo: 100 // Slow down actions for better visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Login first
    const loginSuccess = await login(page, credentials);
    if (!loginSuccess) {
      throw new Error('Login failed');
    }

    // Export each entry
    for (let i = 0; i < entries.length; i++) {
      console.log(`\n[${i + 1}/${entries.length}] Processing entry...`);

      const success = await exportLogbookEntry(page, entries[i]);

      if (success) {
        successCount++;
      } else {
        failedCount++;

        if (screenshotOnError) {
          const screenshotPath = `./screenshots/error-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`   📸 Screenshot saved: ${screenshotPath}`);
        }
      }

      // Wait between entries to avoid rate limiting
      if (i < entries.length - 1) {
        console.log('   ⏳ Waiting before next entry...');
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n📊 Export Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📈 Total: ${entries.length}`);

  } catch (error) {
    console.error('\n❌ Fatal error during export:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { success: successCount, failed: failedCount };
}

/**
 * Example usage - can be run directly
 */
if (require.main === module) {
  const testCredentials: PortalCredentials = {
    username: 'setiadyanwar',
    password: '' // User will fill this manually
  };

  const testEntries: LogbookEntry[] = [
    {
      tanggal: '2025-01-10',
      waktu_mulai: '08:30',
      waktu_selesai: '17:30',
      jenis_kegiatan: 'Berita Acara Kegiatan',
      dosen_penggerak: 'Amata Fami, M.Ds. - 201807198507182001',
      tipe_penyelenggaraan: 'hybrid',
      lokasi: 'PT Telkomsigma, Jakarta',
      keterangan: 'Melaksanakan pengembangan antarmuka pengguna untuk dashboard utama aplikasi Human Resource Information System (HRIS) di PT Telkomsigma menggunakan teknologi React.js sebagai framework frontend dan Tailwind CSS untuk styling.',
      bukti_path: './storage/app/public/bukti/example.jpg'
    }
  ];

  console.log('⚠️  Please set password in testCredentials before running!');
  console.log('Usage: npx ts-node scripts/export-to-portal.ts\n');

  // Uncomment to run
  // exportToPortal(testCredentials, testEntries, { headless: false });
}
