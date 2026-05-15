// tests/fixtures/auth.fixture.js
// ─────────────────────────────────────────────────────────────────────────────
// Fixture reutilizable: arranca cada test ya autenticado como Administrador.
// Uso:  import { test, expect } from '../fixtures/auth.fixture.js';
// ─────────────────────────────────────────────────────────────────────────────

import { test as base, expect } from '@playwright/test';

// ── JWT falso con estructura válida ───────────────────────────────────────────
// jwtDecode en AuthContext valida la firma al montar; un string simple
// como 'fake-jwt' lanza excepción y llama logout() inmediatamente.
// Este token tiene payload { "sub": 1, "exp": 9999999999 } (año 2286).
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6OTk5OTk5OTk5OX0.fake-signature';

// ── URL base exacta (debe coincidir con VITE_API_URL=http://localhost:3000/api)
const API = 'http://localhost:3000/api';

// ── Datos de usuario administrador ───────────────────────────────────────────
export const ADMIN_USER = {
  id_usuario:  1,
  nombre:      'Admin Test',
  email:       'admin@test.com',
  nombre_rol:  'Administrador',
  procesos:    [],
};

// ── Materias primas de prueba ─────────────────────────────────────────────────
export const MATERIAS_MOCK = [
  {
    id_materia:           1,
    codigo:               '61902511179',
    nombre:               'Dióxido de Titanio',
    abreviacion:          'DT',
    categoria:            'Pigmentos',
    id_categoria_materia: 1,
    stockActual:          500,
    stockMinimo:          100,
    stockComprometido:    50,
    stockDisponible:      450,
    estado:               'Activo',
    loteInicialUsado:     true,
  },
  {
    id_materia:           2,
    codigo:               '00000000002',
    nombre:               'Resina Epóxica',
    abreviacion:          'RE',
    categoria:            'Resinas',
    id_categoria_materia: 2,
    stockActual:          80,
    stockMinimo:          100,
    stockComprometido:    0,
    stockDisponible:      80,
    estado:               'Activo',
    loteInicialUsado:     true,
  },
  {
    id_materia:           3,
    codigo:               '00000000003',
    nombre:               'Carbonato de Calcio',
    abreviacion:          'CC',
    categoria:            'Cargas',
    id_categoria_materia: 3,
    stockActual:          150,
    stockMinimo:          100,
    stockComprometido:    0,
    stockDisponible:      150,
    estado:               'Activo',
    loteInicialUsado:     true,
  },
  {
    id_materia:           4,
    codigo:               '00000000004',
    nombre:               'Solvente Xilol',
    abreviacion:          'SX',
    categoria:            'Solventes',
    id_categoria_materia: 4,
    stockActual:          50,
    stockMinimo:          50,
    stockComprometido:    20,
    stockDisponible:      30,
    estado:               'Inhabilitado',
    loteInicialUsado:     true,
  },
];

export const CATEGORIAS_MOCK = [
  { id_categoria_materia: 1, nombre_categoria_materia: 'Pigmentos' },
  { id_categoria_materia: 2, nombre_categoria_materia: 'Resinas'   },
  { id_categoria_materia: 3, nombre_categoria_materia: 'Cargas'    },
  { id_categoria_materia: 4, nombre_categoria_materia: 'Solventes' },
];

export const LOTES_MOCK = [
  {
    id_lote:             101,
    codigo_lote:         'DT-001',
    proveedor:           'Proveedor A',
    fecha_ingreso:       '2024-01-15T00:00:00.000Z',
    stock_inicial:       600,
    stock_restante:      500,
    estado:              'activo',
    numero_orden_compra: 'OC-2024-001',
  },
  {
    id_lote:             102,
    codigo_lote:         'DT-000',
    proveedor:           null,
    fecha_ingreso:       '2023-12-01T00:00:00.000Z',
    stock_inicial:       200,
    stock_restante:      0,
    estado:              'agotado',
    numero_orden_compra: null,
  },
];

// ── Fixture base: intercepta APIs y simula sesión activa ──────────────────────
export const test = base.extend({

  page: async ({ page }, use) => {

    // 1. Inyectar token válido + usuario en localStorage ANTES de navegar.
    //    Sin el token, AuthContext llama logout() al detectar jwtDecode fallido.
    await page.addInitScript(({ user, jwt }) => {
      localStorage.setItem('token',         jwt);
      localStorage.setItem('casercon_user', JSON.stringify(user));
    }, { user: ADMIN_USER, jwt: FAKE_JWT });

    // 2. Mock: GET /materias-primas → lista completa
    await page.route(`${API}/materias-primas`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status:      200,
          contentType: 'application/json',
          body:        JSON.stringify(MATERIAS_MOCK),
        });
      } else {
        await route.continue();
      }
    });

    // 3. Mock: GET /materias-primas/categorias
    await page.route(`${API}/materias-primas/categorias`, async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(CATEGORIAS_MOCK),
      });
    });

    // 4. Mock: GET /materias-primas/:id/lotes
    await page.route(`${API}/materias-primas/*/lotes`, async (route) => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(LOTES_MOCK),
      });
    });

    await use(page);
  },
});

export { expect };