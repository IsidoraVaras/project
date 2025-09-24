// backend/controllers/userController.js (VERSIÓN COMPLETA CON LOGIN Y REGISTRO)

import { getConnection } from '../db.js';
import sql from 'mssql';
import bcrypt from 'bcrypt';

const registerUser = async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await getConnection();

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

const loginUser = async (req, res) => {
  const { email, password } = req.body;

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