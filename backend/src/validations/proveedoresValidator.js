const z = require("zod");

// 1. Esqueme para CREAR usuario (Todo es obligatorio menos id)

//Nota: Es muy similar al registro, pero lo separamos por si las reglas cambian (ej: admin puede crear usuarios sin clave inicial)

const createProveedorSchema = z.object({
  nombre_proveedor: z.string().min(3),
  nombre_empresa: z.string().min(3),
  email: z.string().email(),
  telefono: z.string(),
  direccion: z.string(),
  observaciones: z.string().optional(),
});

// 2. Esquema para ACTUALIZAR usuario (Todo es opcional)
// Usamos .partial() para deicr "validame solo lo que venga, no exijas todo"
const updateProveedorSchema = createProveedorSchema.partial();

const validateCreateProveedor = (data) => {
  return createProveedorSchema.safeParse(data);
};

const validateUpdateProveedor = (data) => {
  return updateProveedorSchema.safeParse(data);
};

module.exports = { validateCreateProveedor, validateUpdateProveedor };
