import sql from 'mssql';

const config = {
  server: 'localhost',
  database: 'Sistema',
  user: 'nodeapp_user',
  password: 'isidora',
  options: {
    trustServerCertificate: true  
  }
};

let pool;

async function connectToDatabase() {
  try {
    if (pool) {
      console.log('Ya existe una conexión a SQL Server.');
      return pool;
    }
    
    pool = await sql.connect(config);
    console.log('Conexión a SQL Server exitosa!');
    return pool;

  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  }
}

export { sql, connectToDatabase as getConnection };
