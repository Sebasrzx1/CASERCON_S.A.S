const z = require("zod");

const createPedidoSchema = z.object({
  id_proveedor:  z.coerce.number().min(1, "Debe seleccionar un proveedor"),
  fecha_entrega: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id_materia:          z.coerce.number().min(1, "Seleccione una materia prima"),
        cantidad_solicitada: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
      })
    )
    .min(1, "Debe agregar al menos un item"),
});

const updatePedidoSchema = createPedidoSchema.partial();

const validateCreateRecepcion = (data) => createPedidoSchema.safeParse(data);
const validateUpdateRecepcion  = (data) => updatePedidoSchema.safeParse(data);

module.exports = { validateCreateRecepcion, validateUpdateRecepcion };