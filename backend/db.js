import sql from 'mssql';

const config = {
  server: 'localhost',
  database: 'Sistema',
  user: 'nodeapp_user',
  password: 'isidora',
  options: {
    trustServerCertificate: true // Resuelve el error de SSL que tenías
  }
};

async function connectToDatabase() {
  try {
    // Intentar conectar a la base de datos
    await sql.connect(config);
    console.log('Conexión a SQL Server exitosa!');
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
}

// Llama a la función para probar la conexión al iniciar el backend
connectToDatabase();

// Exporta la configuración para que otros archivos la usen
export { sql, connectToDatabase };