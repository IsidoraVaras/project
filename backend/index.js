// backend/index.js
import express from 'express';
import cors from 'cors';
import { getConnection } from './db.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001; // Usa el puerto 3001

// Middleware
// Middleware es un software que proporciona servicios a las aplicaciones.
// Aquí se usan para habilitar la comunicación entre front-end y back-end y para procesar los datos recibidos.
app.use(cors()); 
app.use(express.json()); // Permite al servidor leer el cuerpo de las peticiones en formato JSON

// Conexión a la base de datos
// Intentamos conectar a la base de datos una sola vez cuando el servidor se inicia
getConnection()
  .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1); // Cierra el proceso si no hay conexión a la base de datos
  });

// Rutas de la API
// Todas las rutas de usuario comenzarán con '/api'
app.use('/api', userRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});