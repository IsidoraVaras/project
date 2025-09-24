import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`La contraseña encriptada para '${password}' es: ${hashedPassword}`);
};

hashPassword('isidora');  