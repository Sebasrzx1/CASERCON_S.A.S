const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id_usuario,
      rol: user.id_rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

module.exports = { signToken };