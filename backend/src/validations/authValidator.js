// Aqui validaremos pruebas de caja negra para los campos del login y registro

const z = require('zod');

// Reglas de validacion para el registro

// --- SCHEMA PARA LOGIN Y SU FUNCIOND DE VALIDACION
const RegisterSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    
    email: z.string().email("El formato de correo invalido"),

    contraseña: z.string().min(6, 'La contraseña debe tener al menos de 6 caracteres'),
})

const validateRegister = (data) => {
    return RegisterSchema.safeParse(data)
}


// --- SCHEMA PARA LOGIN Y SU FUNCION DE VALIDACION
const loginSchema = z.object({
    email: z.string().email("Formato de correo inválido"),
    contraseña: z.string().min(1, "La contraseña es requerida")
})

const validateLogin = (data) => {
    return loginSchema.safeParse(data)
}

//Exportamos las funciones de validación
module.exports = {validateRegister, validateLogin}