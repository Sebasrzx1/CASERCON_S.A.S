import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  reporter: 'html',
  
  use: {
    headless: false,
    baseURL: 'http://localhost:5173',

    // 📸 Screenshot automático
    screenshot: 'on',

    // 🎥 Video
    video: 'on', 
    // opciones:
    // 'on' → siempre
    // 'off' → nunca
    // 'retain-on-failure' → solo si falla (recomendado)

    // 🧠 Trace (MUY útil)
    trace: 'on',
    // opciones:
    // 'on'
    // 'off'
    // 'on-first-retry'
    // 'retain-on-failure'
  },
});