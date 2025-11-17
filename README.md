# Plataforma de Encuestas CIPAES / UDLA

Aplicación full‑stack para gestionar encuestas psicosociales y de otras categorías.  
Incluye:
- **Frontend** en React + TypeScript + Vite + TailwindCSS.
- **Backend** en Node.js + Express.
- **Base de datos** SQL Server para usuarios, encuestas, preguntas y respuestas.

---

## 1. Requisitos

- Node.js 18+ (recomendado LTS).
- npm 9+.
- SQL Server en ejecución (local o remoto).

---

## 2. Instalación

Clona el repositorio y luego instala dependencias del frontend y backend.

```bash
# En la carpeta raíz del proyecto (frontend)
npm install

# Backend
cd backend
npm install
```

---

## 3. Configuración de la base de datos (SQL Server)

El backend se conecta a SQL Server usando `backend/db.js`.

1. Crea la base de datos (por ejemplo `Sistema`) y las tablas necesarias (`usuarios`, encuestas, preguntas, respuestas, etc.).
2. Ajusta la configuración de conexión en `backend/db.js` según tu entorno:
   - `server`
   - `database`
   - `user`
   - `password`
3. Asegúrate de que el usuario de SQL Server tenga permisos de lectura y escritura sobre la base de datos.

> Nota: en un entorno real es recomendable mover usuario y contraseña a variables de entorno en lugar de dejarlos en el código.

---

## 4. Ejecutar el backend

Desde la carpeta `backend`:

```bash
cd backend
npm start
```

El backend se levanta por defecto en:

- `http://localhost:3001`

Rutas principales (prefijo `/api`):
- `POST /api/register` – registrar usuario.
- `POST /api/login` – iniciar sesión.
- `GET  /api/categories` – listar categorías de encuestas.
- `GET  /api/categories/:id/surveys` – encuestas por categoría.
- `GET  /api/surveys/:id/questions` – preguntas de una encuesta.
- `GET  /api/surveys` – todas las encuestas.
- `GET  /api/users/:id/results` – resultados de un usuario.
- `POST /api/responses` – guardar respuestas.
- `GET  /api/results/:id/export.pdf` – exportar resultado en PDF.

---

## 5. Ejecutar el frontend

Desde la carpeta raíz del proyecto (donde está `vite.config.ts`):

```bash
npm run dev
```

Luego abre en tu navegador:

- `http://localhost:5173` (puerto por defecto de Vite).

> El frontend llama al backend en `http://localhost:3001/api`, así que asegúrate de tener el backend arriba antes de probar.

---

## 6. Flujo principal de la aplicación

- **HomePage**: pantalla de inicio con logos y descripción de la plataforma, botón para ir a iniciar sesión.
- **Login / Registro** (`LoginForm`):
  - Iniciar sesión con correo y contraseña.
  - Crear cuenta con nombre, apellido, correo y contraseña.
  - Si el correo ya está registrado, se muestra el mensaje: **“Este correo ya está registrado.”**
- **Dashboard de Cliente** (`ClientDashboard`):
  - Ver categorías de encuestas (`CategoryGrid`).
  - Ver encuestas por categoría y responderlas (`SurveyForm`).
  - Ver resultados y exportarlos a PDF (`ResultsView`).
  - Editar perfil (`ProfileForm`).
- **Dashboard de Admin** (`AdminDashboard`):
  - Listar usuarios.
  - Crear y eliminar usuarios con rol admin.
  - Ver información de clientes y sus correos.

---

## 7. Estructura de carpetas (resumen)

```text
.
├─ src/                # Frontend (React + Vite)
│  ├─ components/      # Componentes UI (LoginForm, HomePage, Dashboards, etc.)
│  ├─ hooks/           # Hooks personalizados (useAuth, ...)
│  ├─ types/           # Tipos TypeScript compartidos (User, Survey, Category, ...)
│  └─ App.tsx          # Entrada principal de la SPA
│
├─ backend/            # API REST (Node + Express)
│  ├─ controllers/     # Lógica de negocio (usuarios, encuestas, respuestas, exportación PDF)
│  ├─ routes/          # Rutas Express (userRoutes.js)
│  ├─ db.js            # Conexión a SQL Server
│  └─ index.js         # Servidor Express
└─ ...
```

---

## 8. Scripts útiles

En la raíz (frontend):

- `npm run dev` – arranca el frontend en modo desarrollo.
- `npm run build` – genera build de producción.
- `npm run preview` – sirve el build para revisión local.
- `npm run lint` – ejecuta ESLint sobre el código.

En `backend/`:

- `npm start` – inicia el servidor Express.

---

## 9. Notas y próximos pasos

- Configurar variables de entorno para credenciales de base de datos y puerto.
- Agregar validaciones adicionales en formularios (por ejemplo, fuerza de contraseña).
- Agregar tests (unitarios y de integración) tanto para el frontend como para el backend.

