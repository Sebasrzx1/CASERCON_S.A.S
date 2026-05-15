// tests/inventario.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Suite completa: Gestión de Inventario (Materias Primas)
// Rol requerido: Administrador
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, MATERIAS_MOCK, CATEGORIAS_MOCK } from './fixtures/auth.fixture';

// ── URL base del módulo ───────────────────────────────────────────────────────
const URL_INVENTARIO = 'http://localhost:5173/inventario';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ACCESO Y RENDERIZADO INICIAL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('1 · Acceso y renderizado inicial', () => {

  test('muestra el título y el botón de agregar', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await expect(page.getByText('Inventario de Materias Primas')).toBeVisible();
    await expect(page.getByText('Gestión y control de stock')).toBeVisible();
    await expect(page.getByRole('button', { name: /Agregar Materia Prima/i })).toBeVisible();
  });

  test('renderiza las 4 tarjetas de estadísticas', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await expect(page.getByText('Total Activas')).toBeVisible();
    await expect(page.getByText('Stock Suficiente')).toBeVisible();
    await expect(page.getByText('Stock Bajo')).toBeVisible();
    await expect(page.getByText('Stock Crítico')).toBeVisible();
  });

  test('las estadísticas reflejan los datos del mock', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    // Activas del mock: 3 (Solvente Xilol está Inhabilitado)
    const activas = MATERIAS_MOCK.filter(m => m.estado === 'Activo');
    const suficiente = activas.filter(m => m.stockActual > m.stockMinimo * 2).length;
    const bajo       = activas.filter(m => m.stockActual > m.stockMinimo && m.stockActual <= m.stockMinimo * 2).length;

    const cards = page.locator('.grid.grid-cols-1.md\\:grid-cols-4 > div');
    await expect(cards.nth(0).locator('p.text-2xl')).toHaveText(String(activas.length));
    await expect(cards.nth(1).locator('p.text-2xl')).toHaveText(String(suficiente));
    await expect(cards.nth(2).locator('p.text-2xl')).toHaveText(String(bajo));
  });

  test('bloquea acceso si el rol no es Administrador', async ({ browser }) => {
    // JWT válido para que AuthContext no haga logout() por token inválido
    const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImV4cCI6OTk5OTk5OTk5OX0.fake-signature';
    const API = 'http://localhost:3000/api';

    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    // Sesión de Operario con token válido
    await page.addInitScript(({ jwt }) => {
      localStorage.setItem('token', jwt);
      localStorage.setItem('casercon_user', JSON.stringify({
        id_usuario: 2, nombre_rol: 'Operario', procesos: ['recepcion'],
      }));
    }, { jwt: FAKE_JWT });

    await page.route(`${API}/materias-primas`,           r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route(`${API}/materias-primas/categorias`, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await page.goto(URL_INVENTARIO);

    await expect(page.getByText('No tienes permisos para acceder a este módulo.')).toBeVisible();
    await ctx.close();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLA Y FILTROS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('2 · Tabla y filtros', () => {

  test('muestra las materias activas en la tabla por defecto', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    // Solo activas (3)
    const activas = MATERIAS_MOCK.filter(m => m.estado === 'Activo');
    for (const m of activas) {
      await expect(page.getByRole('cell', { name: m.nombre })).toBeVisible();
    }
  });

  test('los badges de estado son correctos', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    // Dióxido de Titanio: 500 actual, 100 mínimo → Suficiente
    await expect(page.getByText('Suficiente').first()).toBeVisible();

    // Resina Epóxica: 80 actual, 100 mínimo → stockActual <= stockMinimo → Crítico
    await expect(page.getByText('Crítico').first()).toBeVisible();
  });

  test('buscar por nombre filtra la tabla', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.fill('input[placeholder="Buscar por nombre..."]', 'Dióxido');

    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Resina Epóxica' })).not.toBeVisible();
  });

  test('buscar algo inexistente muestra el estado vacío', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.fill('input[placeholder="Buscar por nombre..."]', 'xyz_inexistente');

    await expect(page.getByText('No se encontraron materias primas')).toBeVisible();
  });

  test('filtro de stock "Crítico" muestra solo materias críticas', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: 'Crítico' }).click();

    // Resina Epóxica es la única crítica activa
    await expect(page.getByRole('cell', { name: 'Resina Epóxica' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).not.toBeVisible();
  });

  test('filtro de stock "Todos" restaura la vista completa', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: 'Crítico' }).click();
    await page.getByRole('button', { name: 'Todos' }).click();

    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Resina Epóxica' })).toBeVisible();
  });

  test('cambiar a Inhabilitados muestra solo las materias inhabilitadas', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Inhabilitados/i }).click();

    await expect(page.getByRole('cell', { name: 'Solvente Xilol' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).not.toBeVisible();
  });

  test('filtro por categoría funciona correctamente', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    // Abrir panel de categorías
    await page.getByRole('button', { name: /Filtrar por Categoría/i }).click();

    // Marcar solo "Pigmentos"
    await page.getByLabel('Pigmentos').check();

    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Resina Epóxica' })).not.toBeVisible();
  });

  test('limpiar filtros de categoría restaura la tabla', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Filtrar por Categoría/i }).click();
    await page.getByLabel('Pigmentos').check();
    await page.getByRole('button', { name: /Limpiar filtros de categoría/i }).click();

    await expect(page.getByRole('cell', { name: 'Resina Epóxica' })).toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CREAR MATERIA PRIMA
// ─────────────────────────────────────────────────────────────────────────────
test.describe('3 · Crear materia prima', () => {

  test('abre el modal al hacer clic en Agregar', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    await expect(page.getByText('Nueva Materia Prima')).toBeVisible();
  });

  test('cierra el modal con el botón Cancelar', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByText('Nueva Materia Prima')).not.toBeVisible();
  });

  test('muestra errores si se envía el formulario vacío', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    // Todos los campos tienen `required` en el HTML, así el browser bloquea
    // el submit antes de que Zod corra. Llenamos todo excepto stock_min
    // y forzamos el submit directo via JS para saltarnos la validación nativa
    // y dejar que Zod muestre sus errores.
    await page.fill('input[placeholder="Ej: Dióxido de Titanio"]', 'T'); // < 3 chars → Zod falla
    await page.fill('input[placeholder="Ej: 61902511179"]', '12345');
    await page.fill('input[placeholder="Ej: DT"]', 'TS');
    await page.fill('input[placeholder="Ej: 350.00"]', '100');
    await page.fill('input[placeholder="Ej: 100.00"]', '50');
    await page.selectOption('select', { index: 1 });

    await page.getByRole('button', { name: 'Crear Materia Prima' }).click();

    // Zod rechaza el nombre por ser menor a 3 caracteres
    await expect(page.getByText(/El nombre debe tener al menos/i)).toBeVisible();
  });

  test('crea una materia prima con datos válidos', async ({ page }) => {
    // Mock: POST exitoso
    await page.route('**/api/materias-primas', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status:      201,
          contentType: 'application/json',
          body:        JSON.stringify({ message: 'Creada', id_materia: 99 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    await page.fill('input[placeholder="Ej: Dióxido de Titanio"]', 'Nueva Materia Test');
    await page.fill('input[placeholder="Ej: 61902511179"]',        '99999999999');
    await page.fill('input[placeholder="Ej: DT"]',                  'NM');
    await page.fill('input[placeholder="Ej: 350.00"]',              '250');
    await page.fill('input[placeholder="Ej: 100.00"]',              '50');
    await page.selectOption('select', { index: 1 });

    await page.getByRole('button', { name: 'Crear Materia Prima' }).click();

    // El modal cierra y aparece el toast de éxito
    await expect(page.getByText(/materia prima creada/i)).toBeVisible();
    await expect(page.getByText('Nueva Materia Prima')).not.toBeVisible();
  });

  test('muestra error si el servidor rechaza el POST', async ({ page }) => {
    await page.route('**/api/materias-primas', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status:      400,
          contentType: 'application/json',
          body:        JSON.stringify({ message: 'Código duplicado en el servidor' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    await page.fill('input[placeholder="Ej: Dióxido de Titanio"]', 'Materia Duplicada');
    await page.fill('input[placeholder="Ej: 61902511179"]',        '61902511179');
    await page.fill('input[placeholder="Ej: DT"]',                  'MD');
    await page.fill('input[placeholder="Ej: 350.00"]',              '100');
    await page.fill('input[placeholder="Ej: 100.00"]',              '20');
    await page.selectOption('select', { index: 1 });

    await page.getByRole('button', { name: 'Crear Materia Prima' }).click();

    await expect(page.getByText('Código duplicado en el servidor')).toBeVisible();
  });

  test('el contador de caracteres del nombre funciona', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    const input = page.locator('input[placeholder="Ej: Dióxido de Titanio"]');
    await input.fill('Hola');

    // El CharCount debe mostrar 4/80
    await expect(page.getByText('4/80')).toBeVisible();
  });

  test('la abreviación se convierte automáticamente a mayúsculas', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    const abv = page.locator('input[placeholder="Ej: DT"]');
    await abv.fill('nm');

    await expect(abv).toHaveValue('NM');
  });

  test('el campo código solo acepta números', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Agregar Materia Prima/i }).click();

    const codigo = page.locator('input[placeholder="Ej: 61902511179"]');
    await codigo.fill('abc123def');

    await expect(codigo).toHaveValue('123');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EDITAR MATERIA PRIMA
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4 · Editar materia prima', () => {

  test('abre el modal en modo edición con datos precargados', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    // Clic en el botón editar de la primera fila
    await page.locator('button[title="Editar"]').first().click();

    await expect(page.getByText('Editar Materia Prima')).toBeVisible();
    // El nombre de la primera materia activa debe estar en el input
    await expect(
      page.locator('input[placeholder="Ej: Dióxido de Titanio"]')
    ).toHaveValue('Dióxido de Titanio');
  });

  test('el campo stock inicial no aparece al editar (lote ya creado)', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Editar"]').first().click();

    await expect(page.locator('input[placeholder="Ej: 350.00"]')).not.toBeVisible();
  });

  test('muestra el aviso de solo lectura sobre el stock actual', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Editar"]').first().click();

    await expect(
      page.getByText(/El stock actual solo se modifica mediante movimientos/i)
    ).toBeVisible();
  });

  test('guarda los cambios correctamente', async ({ page }) => {
    await page.route('**/api/materias-primas/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status:      200,
          contentType: 'application/json',
          body:        JSON.stringify({ message: 'Actualizada' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Editar"]').first().click();

    const nombre = page.locator('input[placeholder="Ej: Dióxido de Titanio"]');
    await nombre.clear();
    await nombre.fill('Dióxido de Titanio Editado');

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByText(/materia prima actualizada/i)).toBeVisible();
    await expect(page.getByText('Editar Materia Prima')).not.toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 5. INHABILITAR / HABILITAR
// ─────────────────────────────────────────────────────────────────────────────
test.describe('5 · Inhabilitar y habilitar materias primas', () => {

  test('muestra el diálogo de confirmación al inhabilitar', async ({ page }) => {
    await page.route('**/api/materias-primas/1/lotes', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Inhabilitar"]').first().click();

    await expect(page.getByText('Inhabilitar materia prima')).toBeVisible();
    await expect(page.getByRole('button', { name: /Inhabilitar de todas formas/i })).toBeVisible();
  });

  test('cancelar el diálogo no realiza ninguna acción', async ({ page }) => {
    await page.route('**/api/materias-primas/*/lotes', r => r.fulfill({ status: 200, body: '[]' }));

    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Inhabilitar"]').first().click();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByText('Inhabilitar materia prima')).not.toBeVisible();
    // La materia sigue en tabla
    await expect(page.getByRole('cell', { name: 'Dióxido de Titanio' })).toBeVisible();
  });

  test('muestra advertencia si hay lotes activos con stock', async ({ page }) => {
    // El lote DT-001 tiene stock_restante > 0
    await page.route('**/api/materias-primas/1/lotes', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id_lote: 101, estado: 'activo', stock_restante: 500 }
        ]),
      });
    });

    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Inhabilitar"]').first().click();

    await expect(page.getByText('Lotes con stock disponible')).toBeVisible();
  });

  test('inhabilita correctamente tras confirmar', async ({ page }) => {
    await page.route('**/api/materias-primas/*/lotes', r => r.fulfill({ status: 200, body: '[]' }));
    await page.route('**/api/materias-primas/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ message: 'Inhabilitada' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(URL_INVENTARIO);
    await page.locator('button[title="Inhabilitar"]').first().click();
    await page.getByRole('button', { name: /Inhabilitar de todas formas/i }).click();

    await expect(page.getByText(/inhabilitada correctamente/i)).toBeVisible();
  });

  test('habilita una materia inhabilitada desde la vista de Inhabilitados', async ({ page }) => {
    await page.route('**/api/materias-primas/4/habilitar', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Habilitada' }),
      });
    });

    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Inhabilitados/i }).click();

    await page.locator('button[title="Habilitar"]').first().click();
    // Confirm dialog: apuntamos al botón dentro del diálogo, no al de la tabla
    await page.locator('div.fixed button:has-text("Habilitar"):not([title])').click();

    await expect(page.getByText(/habilitada correctamente/i)).toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 6. VER LOTES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('6 · Modal de lotes', () => {

  test('abre el modal de lotes al hacer clic en "Ver Lotes"', async ({ page }) => {
    await page.goto(URL_INVENTARIO);

    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();

    await expect(page.getByText('Lotes de Dióxido de Titanio')).toBeVisible();
    await expect(page.getByText('Trazabilidad por orden de recepción')).toBeVisible();
  });

  test('muestra el lote activo con datos correctos', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();

    await expect(page.getByText('DT-001')).toBeVisible();
    await expect(page.getByText('Proveedor A')).toBeVisible();
    await expect(page.getByText('OC-2024-001')).toBeVisible();
  });

  test('muestra el badge "Agotado" en lotes sin stock', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();

    await expect(page.getByText('Agotado')).toBeVisible();
  });

  test('muestra la barra de progreso en lotes activos', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();

    // El lote DT-001 tiene 500/600 → barra verde
    await expect(page.locator('.bg-green-500')).toBeVisible();
  });

  test('cierra el modal con el botón Cerrar', async ({ page }) => {
    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

    await expect(page.getByText('Lotes de Dióxido de Titanio')).not.toBeVisible();
  });

  test('muestra estado vacío si la materia no tiene lotes', async ({ page }) => {
    // Override: sin lotes
    await page.route('**/api/materias-primas/*/lotes', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(URL_INVENTARIO);
    await page.getByRole('button', { name: /Ver Lotes/i }).first().click();

    await expect(page.getByText('No hay lotes registrados para esta materia prima')).toBeVisible();
  });

});