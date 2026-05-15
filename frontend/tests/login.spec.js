// tests/login.spec.js
import { test, expect } from '@playwright/test';

const LOGIN_ENDPOINT = 'http://localhost:3000/api/auth/login';

// ─── JWT falso pero con estructura válida (header.payload.signature en base64) ─
// El payload tiene exp muy alto para que jwtDecode no lo rechace por expirado
// Payload decodificado: { "sub": 1, "exp": 9999999999 }
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6OTk5OTk5OTk5OX0.fake-signature';

test.describe('Login realista', () => {

  test('login exitoso como administrador', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: FAKE_JWT,
          data: {
            id_usuario:  1,
            nombre:      'Admin Test',
            nombre_rol:  'Administrador',
            procesos:    [],
          }
        })
      });
    });

    await page.goto('/');

    await page.fill('input[type="email"]',    'admin@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("Ingresar")');

    await expect(page).toHaveURL(/dashboard/);

    // Verificar que el contexto guardó bien el usuario
    const user = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('casercon_user'))
    );
    expect(user.nombre_rol).toBe('Administrador');

    // Verificar que el token también se guardó
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('login exitoso como operario de recepción', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: FAKE_JWT,
          data: {
            id_usuario: 2,
            nombre:     'Operario Test',
            nombre_rol: 'Operario',
            procesos:   ['recepcion'],
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="email"]',    'operario@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("Ingresar")');

    await expect(page).toHaveURL(/pedidos/);
  });

  test('login exitoso como operario de producción', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: FAKE_JWT,
          data: {
            id_usuario: 3,
            nombre:     'Operario Prod',
            nombre_rol: 'Operario',
            procesos:   ['produccion'],
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="email"]',    'prod@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("Ingresar")');

    await expect(page).toHaveURL(/produccion/);
  });

  test('login falla con credenciales incorrectas', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales invalidas' })
      });
    });

    await page.goto('/');
    await page.fill('input[type="email"]',    'mal@test.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("Ingresar")');

    await expect(page.locator('text=Credenciales invalidas')).toBeVisible();
    // Debe quedarse en la misma página
    await expect(page).toHaveURL(/\//);
  });

  test('error de conexión muestra mensaje apropiado', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.abort('failed');
    });

    await page.goto('/');
    await page.fill('input[type="email"]',    'admin@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("Ingresar")');

    await expect(
      page.locator('text=Error de conexión con el servidor')
    ).toBeVisible();
  });

  test('operario sin procesos asignados muestra error', async ({ page }) => {

    await page.route(LOGIN_ENDPOINT, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: FAKE_JWT,
          data: {
            id_usuario: 4,
            nombre_rol: 'Operario',
            procesos:   [],   // sin procesos
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="email"]',    'sinprocesos@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("Ingresar")');

    await expect(
      page.locator('text=No tienes procesos asignados')
    ).toBeVisible();
  });

  test('sesión activa redirige sin pasar por el formulario', async ({ page }) => {

    // Simular sesión ya guardada con JWT válido
    await page.addInitScript((jwt) => {
      localStorage.setItem('token', jwt);
      localStorage.setItem('casercon_user', JSON.stringify({
        id_usuario: 1,
        nombre_rol: 'Administrador',
        procesos:   [],
      }));
    }, FAKE_JWT);

    await page.goto('/');

    // El useEffect del Login detecta la sesión y redirige
    await expect(page).toHaveURL(/dashboard/);
  });

});