const z = require("zod");

const createMateriaPrimaSchema = z.object({
    nombre:               z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    codigo:               z.string().min(1, "El código es obligatorio"),
    abreviacion:          z.string().min(1, "La abreviación es obligatoria").max(3, "Máximo 3 caracteres"),
    id_categoria_materia: z.coerce.string().min(1, "Seleccione una categoría"), // 👈 coerce convierte número a string
    stock_min:            z.coerce.number().min(0, "El stock mínimo no puede ser negativo"),
    stock_inicial:        z.coerce.number().min(0.01, "El stock inicial debe ser mayor a 0"),
});

// Al editar, stock_inicial no se envía si el lote ya fue creado
const updateMateriaPrimaSchema = createMateriaPrimaSchema
    .omit({ stock_inicial: true })
    .partial();

const validateCreateMateriaPrima = (data) => createMateriaPrimaSchema.safeParse(data);
const validateUpdateMateriaPrima = (data) => updateMateriaPrimaSchema.safeParse(data);

module.exports = { validateCreateMateriaPrima, validateUpdateMateriaPrima };