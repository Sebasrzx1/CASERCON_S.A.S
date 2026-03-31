const bcrypt = require('bcrypt');
const AppError = require('../errors/AppError');
const httpStatus = require('../constants/httpStatus');
const UserModel = require('../models/userModel') //Importar el modelo 

const UserService = {
    async getAllUsers(){
        //El servicio delega la búsqueda al modelo
        const users = await UserModel.findAll();
        return users;
    },

    async createUser(userData){
        //1. Validar si el email ya exise Regla de negocio
        const existingUser = await UserModel.findByEmail(userData.email);
        if(existingUser){
            throw new AppError('El email ya está registrado', httpStatus.BAD_REQUEST)
        }

        //2. Encriptar la contraseña (SEGURIDAD OBLIGATORIA)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.constraseña, salt) 

        //3. Preparar objeto para el modelo
        const newUser  = {
            ...userData,
            constraseña: hashedPassword
        }

        //4. Llamar al modelo
        const userId = await UserModel.create(newUser);
        return { id: userId, ...newUser}
    },

    async updateUser(id, updateData){
        // 1. verificar si el usuario existe
        const userExists = await UserModel.findById(id)

        // 2. Validar email único si se esta cambiando
        if(updateData.email && updateData.email !== userExists.email){
            const emailInUse = await UserModel.findByEmail(updateData.email)
            if(emailInUse){
                throw new AppError('El email ya esta registrado', httpStatus.BAD_REQUEST)
            }
        }

        // 3. Manejo de contraseña en actualizacion
        let hashedkey = userExists.constraseña; //Por defecto usuamos la que ya tiene
        if(updateData.constraseña && updateData.constraseña.trim() !== ''){
            const salt = await bcrypt.genSalt(10);
            hashedkey = await bcrypt.hash(updateData.constraseña, salt)
        }

        // 4. Construir un objeto con valores actualizados o existentes
        const userToUpdate = {
            id: id,
            nombre: updateData.nombre !== undefined ? updateData.nombre : userExists.nombre,
            email: updateData.email !== undefined ? updateData.email : userExists.email,
            id_rol: updateData.id_rol !== undefined ? updateData.id_rol : userExists.id_rol,
            constraseña: hashedkey
        };

        const affectedRows = await UserModel.update(userToUpdate)
        return affectedRows > 0

    },

    // AñadimoS CurrentUserId
    async deleteUser(idToDelate, CurrentUserId){
        //Prevencion de auto sabotaje (Admin no puede borrarse asi mismo)
        if(Number(idToDelate) === Number(CurrentUserId)){
            throw new AppError(
                'No puedes eliminar tu propia cuenta de administrador',
                httpStatus.FORBIDEN
            )
        }

        // verificacion previa
        //Primero verificamos si existe antes de intentar borrar
        const userExists = await UserModel.findById(idToDelate);

        if(!userExists){
            //Lanzar el error aqui mismo.
            //Asi es el controlador solo tiene que llamar a la funcion y listo.
            throw new AppError('Usuario no encontrado.', httpStatus.NOT_FOUND)
        }
        
        // 3. EJECUTAR EL BORRADO
        const affectedRows = await UserModel.deleteById(idToDelate);

        //Retornar true en caso de exito en el borrado
        return affectedRows > 0
    
    
    }
}

module.exports = UserService;