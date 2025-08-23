#!/usr/bin/env node
// Minimal Playwright-based exporter to studentportal.ipb.ac.id (ESM)
// ENV: PORTAL_USERNAME, PORTAL_PASSWORD

const { chromium } = require('playwright');

// Configuration
const CONFIG = {
  portalUrl: 'https://studentportal.ipb.ac.id/Account/Login',
  timeout: 30000,
  retryAttempts: 3
};

// Selector mappings
const SELECTORS = {
  login: {
    username: ['input[name="Username"]', 'input[name="username"]', '#Username', '#username'],
    password: ['input[name="Password"]', 'input[name="password"]', '#Password', '#password'],
    submit: ['button[type="submit"]', 'input[type="submit"]', '.btn-primary', '.btn-login']
  },
  activity: {
    page: [
      'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka/Index',
      'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka',
      'https://studentportal.ipb.ac.id/Kegiatan'
    ],
    addButton: ['a:has-text("Tambah")', 'button:has-text("Tambah")', '.btn-add', '[data-toggle="modal"]'],
    form: {
      date: ['input[name="Tanggal"]', 'input[name="tanggal"]', '#Tanggal', '#tanggal'],
      timeStart: ['input[name="WaktuMulai"]', 'input[name="waktu_mulai"]', '#WaktuMulai', '#waktu_mulai'],
      timeEnd: ['input[name="WaktuSelesai"]', 'input[name="waktu_selesai"]', '#WaktuSelesai', '#waktu_selesai'],
      location: ['input[name="Lokasi"]', 'input[name="lokasi"]', '#Lokasi', '#lokasi'],
      title: ['input[name="Judul"]', 'input[name="judul"]', '#Judul', '#judul'],
      description: ['textarea[name="Keterangan"]', 'textarea[name="keterangan"]', '#Keterangan', '#keterangan'],
      activityType: ['select[name="JenisKegiatan"]', 'select[name="jenis_kegiatan"]', '#JenisKegiatan', '#jenis_kegiatan'],
      file: ['input[type="file"]', 'input[name="file"]', 'input[name="bukti"]']
    },
    submit: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Simpan")', '.btn-submit']
  }
};

class PortalExporter {
  constructor(config) {
    this.config = { ...CONFIG, ...config };
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      // Enable logging
      this.page.on('console', msg => console.log('Browser:', msg.text()));
      this.page.on('pageerror', error => console.log('Error:', error.message));
      
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error.message);
      return false;
    }
  }

  async findElement(selectors) {
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) return element;
      } catch (e) {}
    }
    return null;
  }

  async fillField(selectors, value) {
    const field = await this.findElement(selectors);
    if (field) {
      await field.fill(value);
      return true;
    }
    return false;
  }

  async selectOption(selectors, value) {
    const select = await this.findElement(selectors);
    if (select) {
      await select.selectOption(value);
      return true;
    }
    return false;
  }

  async uploadFile(selectors, filePath) {
    const input = await this.findElement(selectors);
    if (input && filePath) {
      await input.setInputFiles(filePath);
      return true;
    }
    return false;
  }

  async login(username, password) {
    try {
      console.log('Logging in to portal...');
      await this.page.goto(this.config.portalUrl, { waitUntil: 'networkidle' });
      
      // Wait for login form
      await this.page.waitForSelector('input[name="Username"], input[name="username"], #Username, #username', { 
        timeout: this.config.timeout 
      });
      
      // Fill credentials
      if (!await this.fillField(SELECTORS.login.username, username)) {
        throw new Error('Username field not found');
      }
      
      if (!await this.fillField(SELECTORS.login.password, password)) {
        throw new Error('Password field not found');
      }
      
      // Submit login
      const submitBtn = await this.findElement(SELECTORS.login.submit);
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for login
      await this.page.waitForTimeout(3000);
      
      // Check if login successful
      const currentUrl = this.page.url();
      if (currentUrl.includes('login') || currentUrl.includes('Login')) {
        throw new Error('Login failed');
      }
      
      console.log('Login successful');
      return true;
      
    } catch (error) {
      console.error('Login failed:', error.message);
      return false;
    }
  }

  async navigateToActivityPage() {
    try {
      console.log('Navigating to activity page...');
      
      for (const url of SELECTORS.activity.page) {
        try {
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
          await this.page.waitForTimeout(2000);
          
          const content = await this.page.content();
          if (content.includes('Log Aktivitas') || content.includes('Kegiatan') || content.includes('Tambah')) {
            console.log('Found activity page at:', url);
            return true;
          }
        } catch (e) {
          console.log('Failed to access:', url);
        }
      }
      
      throw new Error('Activity page not found');
      
    } catch (error) {
      console.error('Navigation failed:', error.message);
      return false;
    }
  }

  async openAddForm() {
    try {
      console.log('Opening add form...');
      
      const addBtn = await this.findElement(SELECTORS.activity.addButton);
      if (!addBtn) {
        throw new Error('Add button not found');
      }
      
      await addBtn.click();
      await this.page.waitForTimeout(3000);
      
      return true;
      
    } catch (error) {
      console.error('Failed to open form:', error.message);
      return false;
    }
  }

  async fillForm(formData) {
    try {
      console.log('Filling form...');
      
      // Fill basic fields
      await this.fillField(SELECTORS.activity.form.date, formData.tanggal);
      await this.fillField(SELECTORS.activity.form.timeStart, formData.waktu_mulai);
      await this.fillField(SELECTORS.activity.form.timeEnd, formData.waktu_selesai);
      await this.fillField(SELECTORS.activity.form.location, formData.lokasi);
      
      // Fill optional fields
      if (formData.judul) {
        await this.fillField(SELECTORS.activity.form.title, formData.judul);
      }
      
      await this.fillField(SELECTORS.activity.form.description, formData.keterangan);
      
      // Select activity type
      const activityTypeValue = this.mapActivityType(formData.jenis_kegiatan);
      await this.selectOption(SELECTORS.activity.form.activityType, activityTypeValue);
      
      // Upload file if exists
      if (formData.bukti_path) {
        await this.uploadFile(SELECTORS.activity.form.file, formData.bukti_path);
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to fill form:', error.message);
      return false;
    }
  }

  async submitForm() {
    try {
      console.log('Submitting form...');
      
      const submitBtn = await this.findElement(SELECTORS.activity.submit);
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
      
      await this.page.waitForTimeout(5000);
      
      return true;
      
    } catch (error) {
      console.error('Failed to submit form:', error.message);
      return false;
    }
  }

  async verifySuccess() {
    try {
      console.log('Verifying success...');
      
      // Check for success indicators
      const successSelectors = [
        'text=berhasil',
        'text=success',
        'text=tersimpan',
        '.alert-success',
        '.success-message'
      ];
      
      for (const selector of successSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.count() > 0) {
            console.log('Success indicator found:', selector);
            return true;
          }
        } catch (e) {}
      }
      
      // Check if redirected away from form
      const currentUrl = this.page.url();
      if (!currentUrl.includes('login') && !currentUrl.includes('form')) {
        console.log('Success - redirected to:', currentUrl);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Verification failed:', error.message);
      return false;
    }
  }

  mapActivityType(jenisKegiatan) {
    const mapping = {
      'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)': '1',
      'Berita Acara Ujian': '2',
      'Berita Acara Kegiatan': '3'
    };
    
    return mapping[jenisKegiatan] || '3';
  }

  async export(logData) {
    try {
      if (!await this.init()) {
        throw new Error('Failed to initialize browser');
      }
      
      if (!await this.login(this.config.username, this.config.password)) {
        throw new Error('Login failed');
      }
      
      if (!await this.navigateToActivityPage()) {
        throw new Error('Failed to navigate to activity page');
      }
      
      if (!await this.openAddForm()) {
        throw new Error('Failed to open add form');
      }
      
      if (!await this.fillForm(logData)) {
        throw new Error('Failed to fill form');
      }
      
      if (!await this.submitForm()) {
        throw new Error('Failed to submit form');
      }
      
      if (!await this.verifySuccess()) {
        throw new Error('Export verification failed');
      }
      
      console.log('SUCCESS: Log exported successfully');
      return true;
      
    } catch (error) {
      console.error('Export failed:', error.message);
      return false;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Export function for use in Laravel
async function exportToPortal(logData, credentials) {
  const exporter = new PortalExporter({
    username: credentials.username,
    password: credentials.password
  });
  
  return await exporter.export(logData);
}

// CLI usage
if (require.main === module) {
  const logData = JSON.parse(process.argv[2] || '{}');
  const credentials = JSON.parse(process.argv[3] || '{}');
  
  exportToPortal(logData, credentials)
    .then(success => {
      if (success) {
        console.log('SUCCESS');
        process.exit(0);
      } else {
        console.log('FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = { exportToPortal, PortalExporter };


