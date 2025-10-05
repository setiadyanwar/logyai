#!/usr/bin/env node
// Enhanced Playwright-based exporter to studentportal.ipb.ac.id
// ENV: PORTAL_USERNAME, PORTAL_PASSWORD

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  portalUrl: 'https://studentportal.ipb.ac.id/Account/Login',
  timeout: 45000,
  retryAttempts: 3,
  retryDelay: 2000,
  screenshotOnError: true,
  headless: process.env.PLAYWRIGHT_HEADLESS === 'true' || process.env.HEADLESS === 'true'
};

// Dynamic selector mappings with priority
const SELECTORS = {
  login: {
    username: [
      'input[name="Username"]', 
      'input[name="username"]', 
      '#Username', 
      '#username',
      'input[type="text"]:first-of-type',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]'
    ],
    password: [
      'input[name="Password"]', 
      'input[name="password"]', 
      '#Password', 
      '#password',
      'input[type="password"]',
      'input[placeholder*="password" i]'
    ],
    submit: [
      'button[type="submit"]', 
      'input[type="submit"]', 
      'button:has-text("Login")',
      'button:has-text("Masuk")',
      '.btn-primary', 
      '.btn-login',
      'button:contains("Login")'
    ]
  },
  activity: {
    page: [
      'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka/Index/GCbKV4kvkRLZPJocONGc8s8Vc60nFzk_yAotE-tfeUc',
      'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka/Index',
      'https://studentportal.ipb.ac.id/Kegiatan/LogAktivitasKampusMerdeka',
      'https://studentportal.ipb.ac.id/Kegiatan/Index',
      'https://studentportal.ipb.ac.id/Kegiatan'
    ],
    indicators: [
      'text=Log Aktivitas',
      'text=Kegiatan',
      'text=Tambah Aktivitas',
      'button:has-text("Tambah")',
      '[href*="LogAktivitas"]'
    ],
    addButton: [
      'a[onclick*="OpenModal"]',
      'a[onclick*="Tambah"]',
      'a.btn-tool:has-text("Tambah")',
      'a.btn-default:has-text("Tambah")',
      'a:has-text("Tambah")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      'a:has-text("Add")',
      'button:text-is("Tambah")',
      'a:text-is("Tambah")',
      'button[class*="btn"][class*="add"]',
      'a[class*="btn"][class*="add"]',
      'button.btn-primary:has-text("Tambah")',
      'a.btn-primary:has-text("Tambah")',
      'button.btn-success:has-text("Tambah")',
      '.btn-add',
      '[data-toggle="modal"]',
      'button[onclick*="add"]',
      'button[onclick*="tambah"]',
      'a[href*="add"]',
      'a[href*="create"]',
      'a[href*="tambah"]',
      'button[data-bs-toggle="modal"]',
      'a[data-bs-toggle="modal"]'
    ],
    form: {
      date: [
        'input[name="Waktu"]',
        '#Waktu',
        'input.tanggal',
        'input[name="Tanggal"]',
        '#Tanggal',
        'input[type="date"]',
        'input[placeholder*="tanggal" i]'
      ],
      timeStart: [
        'input[name="Tmw"]',
        '#Tmw',
        'input[placeholder*="Waktu Mulai"]',
        'input[name="WaktuMulai"]',
        '#WaktuMulai',
        'input[type="time"]:first-of-type'
      ],
      timeEnd: [
        'input[name="Tsw"]',
        '#Tsw',
        'input[placeholder*="Waktu Selesai"]',
        'input[name="WaktuSelesai"]',
        '#WaktuSelesai',
        'input[type="time"]:last-of-type'
      ],
      location: [
        'input[name="Lokasi"]',
        '#Lokasi',
        'input[placeholder*="Lokasi"]',
        'input[placeholder*="lokasi" i]'
      ],
      description: [
        'textarea[name="Keterangan"]',
        '#Keterangan',
        'textarea[placeholder*="Topik"]',
        'textarea[placeholder*="keterangan" i]'
      ],
      activityType: [
        'select[name="JenisLogbookKegiatanKampusMerdekaId"]',
        '#JenisLogbookKegiatanKampusMerdekaId',
        'select[name="JenisKegiatan"]',
        '#JenisKegiatan',
        'select.chosen'
      ],
      dosenCheckbox: [
        'input[name="ListDosenPembimbing[0].Value"]',
        '#ListDosenPembimbing_0__Value',
        'input.form-check-input[type="checkbox"]'
      ],
      tipeRadio: [
        'input[name="IsLuring"]',
        'input.IsLuring'
      ],
      file: [
        'input[name="File"]',
        '#File',
        'input[type="file"]',
        'input[accept*=".pdf"]'
      ]
    },
    submit: [
      'button[type="submit"]', 
      'input[type="submit"]', 
      'button:has-text("Simpan")',
      'button:has-text("Save")',
      '.btn-submit',
      '.btn-primary:last-of-type'
    ]
  }
};

class PortalExporter {
  constructor(config) {
    this.config = { ...CONFIG, ...config };
    this.browser = null;
    this.page = null;
    this.retryCount = 0;
  }

  async init() {
    try {
      this.browser = await chromium.launch({ 
        headless: this.config.headless,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      this.page = await this.browser.newPage();
      await this.page.setViewportSize({ width: 1366, height: 768 });
      
      // Enhanced logging and error handling
      this.page.on('console', msg => {
        console.log(`[${msg.type().toUpperCase()}] Browser:`, msg.text());
      });
      
      this.page.on('pageerror', error => {
        console.error('Page Error:', error.message);
      });

      this.page.on('requestfailed', request => {
        console.warn('Request Failed:', request.url(), request.failure()?.errorText);
      });
      
      // Set longer default timeout
      this.page.setDefaultTimeout(this.config.timeout);
      
      console.log('Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error.message);
      await this.takeScreenshot('init-failed');
      return false;
    }
  }

  async takeScreenshot(name) {
    if (!this.config.screenshotOnError || !this.page) return;
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `error-${name}-${timestamp}.png`;
      await this.page.screenshot({ 
        path: filename, 
        fullPage: true 
      });
      console.log(`Screenshot saved: ${filename}`);
    } catch (e) {
      console.warn('Failed to take screenshot:', e.message);
    }
  }

  async retry(operation, operationName, maxRetries = null) {
    const attempts = maxRetries || this.config.retryAttempts;
    
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`${operationName}: Attempt ${i + 1}/${attempts}`);
        return await operation();
      } catch (error) {
        console.warn(`${operationName} failed (attempt ${i + 1}):`, error.message);
        
        if (i === attempts - 1) {
          await this.takeScreenshot(`${operationName.toLowerCase().replace(' ', '-')}-final-failed`);
          throw error;
        }
        
        // Wait before retry
        await this.page.waitForTimeout(this.config.retryDelay * (i + 1));
        
        // Take screenshot on error for debugging
        await this.takeScreenshot(`${operationName.toLowerCase().replace(' ', '-')}-attempt-${i + 1}`);
      }
    }
  }

  async findElement(selectors, timeout = 10000, options = {}) {
    const { requireVisible = true } = options;

    for (const selector of selectors) {
      try {
        console.log(`Trying selector: ${selector}`);

        if (requireVisible) {
          // Wait for selector to be visible
          await this.page.waitForSelector(selector, {
            state: 'visible',
            timeout: timeout / selectors.length
          });
        } else {
          await this.page.waitForSelector(selector, { timeout: timeout / selectors.length });
        }

        const element = await this.page.$(selector);
        if (element) {
          // Double-check visibility if required
          if (requireVisible) {
            const isVisible = await element.isVisible();
            if (!isVisible) {
              console.log(`Element found but not visible: ${selector}`);
              continue;
            }
          }

          console.log(`Found element with selector: ${selector}`);
          return element;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found:`, e.message);
      }
    }
    console.warn('No element found with provided selectors:', selectors);
    return null;
  }

  async fillField(selectors, value, options = {}) {
    const field = await this.findElement(selectors);
    if (field) {
      try {
        // Clear field first
        await field.fill('');
        await this.page.waitForTimeout(500);
        
        // Fill with value
        await field.fill(value);
        await this.page.waitForTimeout(500);
        
        // Verify value was set
        const currentValue = await field.inputValue();
        if (currentValue !== value && !options.skipValidation) {
          console.warn(`Field value mismatch. Expected: ${value}, Got: ${currentValue}`);
        }
        
        console.log(`Successfully filled field with: ${value}`);
        return true;
      } catch (error) {
        console.error('Error filling field:', error.message);
        return false;
      }
    }
    return false;
  }

  async selectOption(selectors, value) {
    const select = await this.findElement(selectors);
    if (select) {
      try {
        // Try by value first, then by text
        try {
          await select.selectOption({ value: value });
        } catch (e) {
          await select.selectOption({ label: value });
        }
        console.log(`Successfully selected option: ${value}`);
        return true;
      } catch (error) {
        console.error('Error selecting option:', error.message);
        return false;
      }
    }
    return false;
  }

  async uploadFile(selectors, filePath) {
    // File inputs can be hidden, so don't require them to be visible
    const input = await this.findElement(selectors, 10000, { requireVisible: false });
    if (input && filePath) {
      try {
        // Verify file exists
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return false;
        }

        // Get file stats for verification
        const stats = fs.statSync(filePath);
        console.log(`File size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        // Set the input files
        await input.setInputFiles(filePath);
        console.log(`File set to input: ${filePath}`);

        // Wait a bit for the file to be processed
        await this.page.waitForTimeout(1000);

        // Trigger multiple events to ensure any listeners are notified
        await input.evaluate(el => {
          // Trigger input event
          const inputEvent = new Event('input', { bubbles: true });
          el.dispatchEvent(inputEvent);

          // Trigger change event
          const changeEvent = new Event('change', { bubbles: true });
          el.dispatchEvent(changeEvent);

          // Also trigger using jQuery if available
          if (window.$ && window.$(el).length) {
            window.$(el).trigger('change');
          }
        });
        console.log('File input events triggered (input, change, jQuery change)');

        // Additional wait to ensure file is processed
        await this.page.waitForTimeout(2000);

        // Verify file was actually set
        const hasFile = await input.evaluate(el => {
          return el.files && el.files.length > 0 ? {
            count: el.files.length,
            name: el.files[0].name,
            size: el.files[0].size,
            type: el.files[0].type
          } : null;
        });

        if (hasFile) {
          console.log(`File verified in input:`, hasFile);
        } else {
          console.warn('WARNING: File not found in input element after setting!');
          return false;
        }

        // Check if there's a hidden FilePath input that needs to be set
        try {
          const filePathInput = await this.page.$('input[name="FilePath"]');
          if (filePathInput) {
            const fileName = filePath.split('/').pop().split('\\').pop();
            await filePathInput.evaluate((el, name) => {
              el.value = name;
            }, fileName);
            console.log(`FilePath hidden input set to: ${fileName}`);
          }
        } catch (e) {
          console.log('No FilePath hidden input found (this is OK)');
        }

        // Wait for any file validation or processing to complete
        await this.page.waitForTimeout(2000);

        // Check if there's any file validation message or preview
        const fileValidation = await this.page.evaluate(() => {
          // Check for file name display or preview
          const fileNameDisplay = document.querySelector('.file-name, .filename, [class*="file"]');
          const validationMsg = document.querySelector('.field-validation-valid[data-valmsg-for="File"]');

          return {
            hasFileNameDisplay: fileNameDisplay ? fileNameDisplay.textContent.trim() : null,
            validationState: validationMsg ? validationMsg.className : null,
            fileInputValue: document.querySelector('input[name="File"]')?.value || null
          };
        });

        console.log('File validation state:', fileValidation);
        console.log(`Successfully uploaded file: ${filePath}`);
        return true;
      } catch (error) {
        console.error('Error uploading file:', error.message);
        return false;
      }
    }
    return false;
  }

  mapTipePenyelenggaraan(tipe) {
    // Map tipe_penyelenggaraan to portal's IsLuring radio button values
    // Portal expects: '' for hybrid, 'true' for offline, 'false' for online
    const mapping = {
      'hybrid': '',
      'offline': 'true',
      'online': 'false'
    };

    const normalizedTipe = (tipe || 'hybrid').toLowerCase();
    const result = mapping[normalizedTipe] || '';

    console.log(`Mapping tipe '${tipe}' to value '${result}'`);
    return result;
  }

  async login(username, password) {
    return await this.retry(async () => {
      console.log('Navigating to login page...');
      await this.page.goto(this.config.portalUrl, { 
        waitUntil: 'networkidle',
        timeout: this.config.timeout 
      });
      
      // Wait for login form with extended timeout
      console.log('Waiting for login form...');
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(2000);
      
      // Fill credentials with retry
      console.log('Filling username...');
      if (!await this.fillField(SELECTORS.login.username, username)) {
        throw new Error('Username field not found');
      }
      
      console.log('Filling password...');
      if (!await this.fillField(SELECTORS.login.password, password)) {
        throw new Error('Password field not found');
      }
      
      // Submit login
      console.log('Submitting login form...');
      const submitBtn = await this.findElement(SELECTORS.login.submit);
      if (submitBtn) {
        await submitBtn.click();
      } else {
        console.log('Submit button not found, trying Enter key...');
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for navigation with multiple checks
      console.log('Waiting for login response...');
      await this.page.waitForTimeout(5000);
      
      // Enhanced login verification
      const currentUrl = this.page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Check for login success indicators
      const loginSuccessIndicators = [
        () => !currentUrl.toLowerCase().includes('login'),
        () => this.page.locator('text=Dashboard').isVisible().catch(() => false),
        () => this.page.locator('text=Logout').isVisible().catch(() => false),
        () => this.page.locator('text=Keluar').isVisible().catch(() => false),
        () => this.page.locator('[href*="logout"]').isVisible().catch(() => false)
      ];
      
      // Check for login failure indicators
      const loginErrorSelectors = [
        'text=Username atau password salah',
        'text=Login failed',
        'text=Invalid credentials',
        '.alert-danger',
        '.error-message'
      ];
      
      // Check for error messages
      for (const selector of loginErrorSelectors) {
        try {
          const errorElement = await this.page.locator(selector).first();
          if (await errorElement.isVisible()) {
            throw new Error(`Login failed: ${await errorElement.textContent()}`);
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }
      
      // Check for success indicators
      let loginSuccess = false;
      for (const indicator of loginSuccessIndicators) {
        try {
          if (await indicator()) {
            loginSuccess = true;
            break;
          }
        } catch (e) {
          // Continue checking other indicators
        }
      }
      
      if (!loginSuccess && currentUrl.toLowerCase().includes('login')) {
        throw new Error('Login verification failed - still on login page');
      }
      
      console.log('Login successful - authenticated');
      return true;
      
    }, 'Login');
  }

  async navigateToActivityPage() {
    return await this.retry(async () => {
      console.log('Searching for activity page...');

      for (const url of SELECTORS.activity.page) {
        try {
          console.log(`Trying to access: ${url}`);
          const currentUrl = this.page.url();
          console.log(`Current URL before navigation: ${currentUrl}`);

          await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout / 2
          });

          // Wait for page to load
          await this.page.waitForTimeout(3000);

          const finalUrl = this.page.url();
          console.log(`Final URL after navigation: ${finalUrl}`);

          // Check for activity page indicators AND Tambah button
          let pageFound = false;
          for (const indicator of SELECTORS.activity.indicators) {
            try {
              const element = await this.page.locator(indicator).first();
              if (await element.isVisible()) {
                console.log(`Activity page confirmed with indicator: ${indicator}`);
                pageFound = true;
                break;
              }
            } catch (e) {
              // Continue checking other indicators
            }
          }

          // Also check if Tambah button exists
          let buttonFound = false;
          if (pageFound) {
            for (const selector of SELECTORS.activity.addButton.slice(0, 5)) {
              try {
                const button = await this.page.locator(selector).first();
                if (await button.isVisible({ timeout: 2000 })) {
                  console.log(`Tambah button found with selector: ${selector}`);
                  buttonFound = true;
                  break;
                }
              } catch (e) {
                // Continue checking
              }
            }
          }

          if (pageFound && buttonFound) {
            console.log(`Successfully accessed activity page with Tambah button: ${finalUrl}`);
            return true;
          } else if (pageFound) {
            console.log(`Page found but Tambah button not visible, trying next URL...`);
          } else {
            console.log(`Page found but no activity indicators detected: ${url}`);
          }

        } catch (e) {
          console.log(`Failed to access ${url}:`, e.message);
        }
      }
      
      // Try to find activity page through navigation
      console.log('Trying to find activity page through menu navigation...');
      const menuSelectors = [
        'a[href*="Kegiatan"]',
        'a[href*="LogAktivitas"]', 
        'text=Kegiatan',
        'text=Log Aktivitas',
        'text=Activity'
      ];
      
      for (const selector of menuSelectors) {
        try {
          const menuItem = await this.page.locator(selector).first();
          if (await menuItem.isVisible()) {
            console.log(`Found menu item: ${selector}`);
            await menuItem.click();
            await this.page.waitForTimeout(3000);
            
            // Verify we're on the right page
            for (const indicator of SELECTORS.activity.indicators) {
              try {
                const element = await this.page.locator(indicator).first();
                if (await element.isVisible()) {
                  console.log('Activity page reached through navigation');
                  return true;
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          console.log(`Menu navigation failed with ${selector}:`, e.message);
        }
      }
      
      throw new Error('Activity page not found through direct access or navigation');
      
    }, 'Navigate to Activity Page');
  }

  async openAddForm() {
    return await this.retry(async () => {
      console.log('Looking for add button...');
      
      const addBtn = await this.findElement(SELECTORS.activity.addButton);
      if (!addBtn) {
        throw new Error('Add button not found');
      }
      
      console.log('Clicking add button...');
      await addBtn.click();
      await this.page.waitForTimeout(3000);
      
      // Wait for form to appear
      const formIndicators = [
        ...SELECTORS.activity.form.date,
        ...SELECTORS.activity.form.description,
        ...SELECTORS.activity.form.location
      ];
      
      let formVisible = false;
      for (const selector of formIndicators) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          formVisible = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!formVisible) {
        throw new Error('Form did not appear after clicking add button');
      }
      
      console.log('Add form opened successfully');
      return true;
      
    }, 'Open Add Form');
  }

  formatDateForPortal(dateString) {
    // Convert YYYY-MM-DD to DD/MM/YYYY for Indonesian portal
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  }

  async fillForm(formData) {
    return await this.retry(async () => {
      console.log('Filling form with data:', formData);

      // Wait for modal to be fully visible
      console.log('Waiting for modal to be visible...');
      try {
        await this.page.waitForSelector('.modal.show, .modal.fade.show, #myModal[style*="display: block"]', {
          state: 'visible',
          timeout: 5000
        });
        console.log('Modal is visible');
        await this.page.waitForTimeout(1000);
      } catch (e) {
        console.warn('Modal not detected with standard selectors, continuing anyway...');
      }

      // Format date to dd/mm/yyyy for Indonesian portal
      const formattedDate = this.formatDateForPortal(formData.tanggal);
      console.log(`Date formatted: ${formData.tanggal} -> ${formattedDate}`);

      // Fill date field with datepicker API
      console.log('Filling date field with datepicker...');
      const dateSet = await this.page.evaluate((dateValue) => {
        const input = document.querySelector('input[name="Waktu"]');
        if (!input) {
          return { success: false, error: 'Date input not found' };
        }

        // Set value directly
        input.value = dateValue;

        // Trigger datepicker setDate if available
        if (window.$ && window.$(input).data('datepicker')) {
          window.$(input).datepicker('setDate', dateValue);
          window.$(input).datepicker('update');
        }

        // Trigger change events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        if (window.$) {
          window.$(input).trigger('change');
          window.$(input).trigger('changeDate');
        }

        return {
          success: true,
          value: input.value
        };
      }, formattedDate);

      console.log('Date field result:', dateSet);

      if (!dateSet.success) {
        throw new Error('Failed to fill date field: ' + dateSet.error);
      }

      const fillOperations = [
        { field: 'timeStart', data: formData.waktu_mulai, required: true },
        { field: 'timeEnd', data: formData.waktu_selesai, required: true },
        { field: 'location', data: formData.lokasi, required: true },
        { field: 'description', data: formData.keterangan, required: true }
      ];

      // Fill form fields sequentially
      for (const operation of fillOperations) {
        if (!operation.data && operation.required) {
          throw new Error(`Required field ${operation.field} is missing data`);
        }

        if (operation.data) {
          const success = await this.fillField(
            SELECTORS.activity.form[operation.field],
            operation.data
          );

          if (!success && operation.required) {
            throw new Error(`Failed to fill required field: ${operation.field}`);
          }

          // Small delay between fields
          await this.page.waitForTimeout(500);
        }
      }
      
      // Select activity type (uses Select2)
      console.log('Selecting activity type...');
      const activityTypeValue = this.mapActivityType(formData.jenis_kegiatan);

      try {
        // Select2 needs special handling - use Select2 API
        const selected = await this.page.evaluate((value) => {
          const select = document.querySelector('select[name="JenisLogbookKegiatanKampusMerdekaId"]');
          if (!select) {
            return { success: false, error: 'Select element not found' };
          }

          // First set the native select value
          select.value = value;

          // Then use jQuery and Select2 to trigger changes
          if (window.$ && window.$(select).data('select2')) {
            // Select2 is initialized - use Select2 API
            window.$(select).val(value).trigger('change.select2');
            window.$(select).trigger('change');

            // Verify the value was set
            const currentValue = window.$(select).val();
            return {
              success: true,
              setValue: value,
              currentValue: currentValue,
              matched: currentValue === value
            };
          } else if (window.$) {
            // jQuery available but Select2 not initialized yet
            window.$(select).val(value).trigger('change');
            return { success: true, setValue: value, note: 'Select2 not initialized, used jQuery' };
          } else {
            // No jQuery - use native events
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
            return { success: true, setValue: value, note: 'No jQuery, used native event' };
          }
        }, activityTypeValue);

        console.log('Activity type selection result:', selected);

        if (!selected.success) {
          throw new Error(selected.error || 'Failed to select activity type');
        }

        if (selected.matched === false) {
          console.warn(`Value mismatch: set ${selected.setValue}, got ${selected.currentValue}`);
        }

        await this.page.waitForTimeout(1000);
        console.log('Activity type selected via Select2:', activityTypeValue);
      } catch (error) {
        console.warn('Failed to select activity type:', error.message);
      }

      // Check dosen penggerak checkbox
      console.log('Checking dosen penggerak checkbox...');
      try {
        const dosenCheckbox = await this.findElement(SELECTORS.activity.form.dosenCheckbox);
        if (dosenCheckbox) {
          await dosenCheckbox.check();
          console.log('Dosen penggerak checkbox checked');
        } else {
          console.warn('Dosen penggerak checkbox not found');
        }
      } catch (error) {
        console.warn('Failed to check dosen penggerak:', error.message);
      }

      // Select tipe penyelenggaraan radio
      console.log('Selecting tipe penyelenggaraan:', formData.tipe_penyelenggaraan);
      try {
        const tipeValue = this.mapTipePenyelenggaraan(formData.tipe_penyelenggaraan);
        const radioButtons = await this.page.locator(SELECTORS.activity.form.tipeRadio[0]);
        const count = await radioButtons.count();

        for (let i = 0; i < count; i++) {
          const radio = radioButtons.nth(i);
          const value = await radio.getAttribute('value');

          if (value === tipeValue) {
            await radio.check();
            console.log(`Tipe penyelenggaraan selected: ${tipeValue}`);
            break;
          }
        }
      } catch (error) {
        console.warn('Failed to select tipe penyelenggaraan:', error.message);
      }

      // Upload file if exists
      if (formData.bukti_path) {
        console.log('Uploading file...');
        const uploadSuccess = await this.uploadFile(
          SELECTORS.activity.form.file,
          formData.bukti_path
        );

        if (!uploadSuccess) {
          console.warn('Failed to upload file, continuing without attachment...');
        }
      }

      console.log('Form filled successfully');
      return true;
      
    }, 'Fill Form');
  }

  async submitForm() {
    try {
      console.log('Submitting form...');

      // Listen for any alerts or validation messages
      this.page.on('dialog', async dialog => {
        console.log(`Alert detected: ${dialog.message()}`);
        await dialog.accept();
      });

      // Wait for any potential AJAX response
      const responsePromise = this.page.waitForResponse(
        response => response.url().includes('LogAktivitasKampusMerdeka'),
        { timeout: 15000 }
      ).catch(() => null);

      const submitBtn = await this.findElement(SELECTORS.activity.submit);
      if (submitBtn) {
        await submitBtn.click();
        console.log('Submit button clicked');
      } else {
        console.log('Submit button not found, trying Enter key...');
        await this.page.keyboard.press('Enter');
      }

      // Wait a bit for form to start submitting
      await this.page.waitForTimeout(2000);

      // Check for validation errors in the modal
      const validationErrors = await this.page.evaluate(() => {
        const errors = [];

        // Check for jQuery validation errors
        const errorElements = document.querySelectorAll('.field-validation-error, .text-danger:not(.field-validation-valid)');
        errorElements.forEach(el => {
          if (el.textContent.trim()) {
            errors.push(el.textContent.trim());
          }
        });

        // Check for any alert messages
        const alerts = document.querySelectorAll('.alert-danger, .alert-error');
        alerts.forEach(el => {
          errors.push(el.textContent.trim());
        });

        return errors;
      });

      if (validationErrors.length > 0) {
        console.error('Validation errors detected:', validationErrors);
        await this.takeScreenshot('validation-errors');
        throw new Error(`Form validation failed: ${validationErrors.join(', ')}`);
      }

      // Wait for AJAX response
      console.log('Waiting for server response...');
      const response = await responsePromise;

      if (response) {
        console.log(`Got response from: ${response.url()}, status: ${response.status()}`);

        // If response is not OK, there might be an error
        if (response.status() >= 400) {
          console.error(`Server error: ${response.status()}`);
          await this.takeScreenshot('server-error');
        }
      }

      // Wait for modal to close (indicates success) OR error message to appear
      await this.page.waitForTimeout(3000);

      // Check if modal is still visible (might indicate error)
      const modalStillVisible = await this.page.evaluate(() => {
        const modal = document.querySelector('#main_modal, .modal.show');
        return modal && window.getComputedStyle(modal).display !== 'none';
      });

      if (modalStillVisible) {
        console.warn('Modal still visible after submit - checking for errors...');
        await this.takeScreenshot('modal-still-visible');

        // Check again for any new validation messages
        const newErrors = await this.page.evaluate(() => {
          const errors = [];
          document.querySelectorAll('.field-validation-error, .alert-danger').forEach(el => {
            if (el.textContent.trim()) errors.push(el.textContent.trim());
          });
          return errors;
        });

        if (newErrors.length > 0) {
          throw new Error(`Form errors: ${newErrors.join(', ')}`);
        }
      } else {
        console.log('Modal closed - form submitted successfully');
      }

      // Additional wait to ensure page updates
      await this.page.waitForTimeout(2000);

      return true;

    } catch (error) {
      // "Execution context was destroyed" means page navigated (likely success)
      if (error.message && error.message.includes('Execution context was destroyed')) {
        console.log('Page navigated after submit - likely successful submission');
        return true;
      }

      console.error('Failed to submit form:', error.message);
      await this.takeScreenshot('submit-failed');
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

      // Click "Tambah" button to open modal
      if (!await this.openAddForm()) {
        throw new Error('Failed to open add form modal');
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


