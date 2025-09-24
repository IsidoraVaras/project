import sql from 'mssql';

const config = {
  server: 'localhost',
  database: 'Sistema',
  user: 'nodeapp_user',
  password: 'isidora',
  options: {
    trustServerCertificate: true // Resuelve el error de SSL
  }
};

// Variable para almacenar el pool de conexiones
let pool;

async function connectToDatabase() {
  try {
    // Si el pool ya existe, no creamos uno nuevo
    if (pool) {
      console.log('Ya existe una conexión a SQL Server.');
      return pool;
    }
    
    // Crea un nuevo pool de conexiones
    pool = await sql.connect(config);
    console.log('Conexión a SQL Server exitosa!');
    return pool;

  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err; // Lanza el error para que pueda ser manejado en la aplicación
  }
}

// Exporta la función que devuelve el pool de conexiones
export { sql, connectToDatabase as getConnection };