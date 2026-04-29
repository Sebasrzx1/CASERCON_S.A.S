import { test, expect } from '@playwright/test';

test.describe('Login realista', () => {

  test('login exitoso como administrador', async ({ page }) => {

    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: "success",
          token: "fake-jwt",
          data: {
            nombre_rol: "Administrador",
            procesos: []
          }
        })
    });
    });

    await page.goto('http://localhost:5173');

    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', '123456');

    await page.click('button:has-text("Ingresar")');

    await expect(page).toHaveURL(/dashboard/);

    const user = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("casercon_user"))
    );

    expect(user.nombre_rol).toBe("Administrador");
  });

  test('login falla con credenciales incorrectas', async ({ page }) => {

    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: "Credenciales invalidas"
        })
      });
    });

    await page.goto('http://localhost:5173');

    await page.fill('input[type="email"]', 'mal@test.com');
    await page.fill('input[type="password"]', 'wrong');

    await page.click('button:has-text("Ingresar")');

    // ❌ Validar mensaje real
    await expect(page.locator('text=Credenciales invalidas')).toBeVisible();
  });

});