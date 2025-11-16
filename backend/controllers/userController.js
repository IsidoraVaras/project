import { getConnection } from '../db.js';
import sql from 'mssql';
import bcrypt from 'bcrypt';

// Registro de usuario 
const registerUser = async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await getConnection();

    // Verificar si ya existe un usuario con el mismo correo
    const userExists = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT 1 FROM usuarios WHERE email = @email');

    if (userExists.recordset.length > 0) {
      return res.status(409).json({ message: 'Este correo ya está registrado.' });
    }

    const role = 'cliente';

    const result = await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('apellido', sql.NVarChar, apellido)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('rol', sql.NVarChar, role)
      .query('INSERT INTO usuarios (nombre, apellido, email, password, rol) OUTPUT INSERTED.id VALUES (@nombre, @apellido, @email, @password, @rol)');

    const newUserId = result.recordset[0].id;

    const newUser = {
      id: newUserId,
      nombre,
      apellido,
      email,
      role
    };

    res.status(201).json({ 
      success: true,
      message: 'Usuario registrado con éxito.',
      user: newUser 
    });

  } catch (err) {
    console.error('Error al registrar el usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Login de usuario 
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validación básica de credenciales
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const pool = await getConnection();

    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = @email');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const user = userResult.recordset[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const userData = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.rol,
      };
      return res.status(200).json({ success: true, user: userData });
    } else {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export { registerUser, loginUser };

// listar usuarios para panel admin 
export const listUsers = async (_req, res) => {
  try {
    const pool = await getConnection();
    // Traer todos los usuarios para mostrarlos en el panel 
    const rs = await pool.request().query(
      'SELECT id, nombre, apellido, email, rol FROM usuarios'
    );

    const users = rs.recordset.map((u) => ({
      id: String(u.id),
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      role: u.rol === 'admin' ? 'admin' : 'client',
    }));
    res.status(200).json(users);
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// crear usuario con rol admin 
export const createAdminUser = async (req, res) => {
  const { nombre, apellido, email, password } = req.body || {};

  // Validación de datos para crear admin
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const pool = await getConnection();

    // Verificar si el correo ya está en uso
    const existing = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT 1 FROM dbo.usuarios WHERE email=@email');
    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: 'Este correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insert = await pool
      .request()
      .input('nombre', sql.NVarChar, nombre)
      .input('apellido', sql.NVarChar, apellido)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashed)
      .input('rol', sql.NVarChar, 'admin')
      .query(
        'INSERT INTO dbo.usuarios (nombre, apellido, email, password, rol) OUTPUT INSERTED.id VALUES (@nombre, @apellido, @email, @password, @rol)'
      );

    const id = insert.recordset[0].id;
    return res.status(201).json({
      id: String(id),
      nombre,
      apellido,
      email,
      role: 'admin',
    });
  } catch (err) {
    console.error('Error al crear admin:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// eliminar usuario con rol admin 
export const deleteAdminUser = async (req, res) => {
  const idParam = req.params.id;
  const id = parseInt(idParam, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido.' });
  }

  try {
    const pool = await getConnection();

    // Verificar que el usuario exista y que tenga rol admin
    const userRs = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT rol FROM dbo.usuarios WHERE id=@id');
    if (userRs.recordset.length === 0) {
      return res.status(404).json({ message: 'No existe el usuario.' });
    }
    const rol = String(userRs.recordset[0].rol || '').toLowerCase();
    if (rol !== 'admin') {
      return res.status(403).json({ message: 'El usuario no tiene rol admin.' });
    }

    // Eliminar usuario admin por ID 
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.usuarios WHERE id=@id');

    const affected = Array.isArray(result.rowsAffected)
      ? result.rowsAffected.reduce((a, b) => a + b, 0)
      : (result.rowsAffected || 0);
    if (!affected) {
      return res.status(500).json({ message: 'No se pudo eliminar (sin cambios).' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error al eliminar admin:', err);
    
    if (err && (err.number === 547 || String(err.message || '').includes('DELETE statement conflicted'))) {
      return res.status(409).json({ message: 'No se puede eliminar: tiene registros relacionados.' });
    }
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
