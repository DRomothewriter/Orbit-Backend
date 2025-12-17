
# Orbit

Orbit es una aplicación backend desarrollada en TypeScript que implementa un sistema de mensajería en tiempo real y gestión de tareas colaborativas. Permite la comunicación instantánea entre usuarios mediante WebSockets y un servidor construido con Express y Socket.IO. Además, ofrece funcionalidades como creación de grupos, equipos, listas de tareas y asignación de responsables.

## Características principales
- Autenticación de usuarios
- Creación y gestión de grupos y equipos
- Mensajería en tiempo real
- Listas de tareas colaborativas (ToDo por grupo)
- Documentación interactiva con Swagger

## Instalación
1. Clona el repositorio:
	```bash
	git clone https://github.com/DRomothewriter/Orbit.git
	cd Orbit
	```
2. Instala las dependencias:
	```bash
	npm install
	```
3. Crea un archivo `.env` en la raíz del proyecto basándote en `.env.template`:
	```env
	PORT=3000
	MONGO_URI=url_de_base_de_datos_de_mongo
	JWT_SECRET=tu_palabra_random_para_encriptar
	
	# AWS S3 para almacenamiento de archivos
	S3_ACCESS_KEY=tu_access_key
	S3_SECRET_KEY=tu_secret_key
	S3_REGION=tu_region
	
	# Google OAuth
	GOOGLE_ID=tu_google_client_id
	GOOGLE_CLIENT_ID=tu_google_client_id
	
	# URL del frontend (sin / al final)
	FRONTEND_URL=http://localhost:4200
	
	# Email de remitente para correos del sistema
	FROM_EMAIL=noreply@orbit.com
	
	# Configuración SMTP
	SMTP_HOST=smtp.gmail.com
	SMTP_PORT=587
	SMTP_SECURE=false
	SMTP_USER=tu-correo@gmail.com
	SMTP_PASS=tu-contraseña-de-aplicacion
	
	# Mediasoup (para videollamadas)
	MEDIASOUP_LISTEN_IP=0.0.0.0
	MEDIASOUP_ANNOUNCED_IP=127.0.0.1
	MEDIASOUP_MIN_PORT=10000
	MEDIASOUP_MAX_PORT=10100
	```
4. Inicia el servidor en modo desarrollo:
	```bash
	npm run dev
	```

## Uso
El servidor se ejecutará por defecto en `http://localhost:3000`. 

La documentación de la API está disponible en: `http://localhost:3000/swagger`

## Rutas principales

### Autenticación
- `POST /auth/login` — Iniciar sesión
- `POST /auth/signup` — Registrar usuario

### Usuarios
- `GET /users` - Listar usarios
- `GET /users/my-user` — Mi usuario
- `GET /users/userId` — Obtener usuario por ID
- `PUT /users/updateUser` — Modificar usuario
- `DELETE /users/delteUser` — Eliminar usuario

### Grupos
- `GET /groups/my-groups` — Listar grupos del usuario
- `GET /groups/{groupId}` — Obtener grupo por ID
- `POST /groups` - Crear grupo
- `POST /groups/add-groupmember` - Añadir miembro al grupo
- `PUT /groups/change-group-info` - Actualizar grupo
- `DELETE /groups/{groupId}` - Borrar grupo
- `DELETE /groups/{groupId}/remove-member/{userId}` - Borrar miembro de grupo

### Comunidades
- `GET /communities/my-communities` — Listar comunidades del usuario
- `GET /communities/{communityId}` — Obtener comunidad por ID
- `POST /communities` - Crear comunidad
- `POST /communities/add-member` - Añadir miembro a la comunidad
- `PUT /communities/change-community-info` - Actualizar comunidad
- `DELETE /communities/{communityId}` - Borrar comunidad
- `DELETE /communities/{communityId}/remove-member/{userId}` - Borrar miembro de comunidad

### Mensajes
- `GET /messages/{groupId}?page=1` — Listar mensajes de un grupo (paginados, incluye reacciones)
- `GET /messages/{messageId}` — Obtener mensaje por ID
- `POST /messages` — Crear un nuevo mensaje
- `PUT /messages/{messageId}` — Actualizar un mensaje
- `DELETE /messages/{messageId}` — Eliminar un mensaje
- `POST /messages/reaction` — Crear una reacción para un mensaje
- `DELETE /messages/reaction/{reactionId}` — Eliminar una reacción de un mensaje

### Tareas
- `POST /tasks` — Crear tarea
- `GET /tasks/{taskId}` — Obtener tarea por ID
- `PUT /tasks/modifyTask` — Modificar tarea
- `DELETE /tasks/{taskId}` — Eliminar tarea

### Notificaciones
- `GET /notifications` — Obtener notificaciones del usuario
- `PUT /notifications/{notificationId}/read` — Marcar notificación como leída
- `DELETE /notifications/{notificationId}` — Eliminar notificación

## Tecnologías utilizadas
- Node.js
- TypeScript
- Express
- Mongoose (MongoDB)
- Socket.IO (Mensajería en tiempo real)
- Mediasoup (Videollamadas WebRTC)
- Google OAuth (Autenticación)
- AWS S3 (Almacenamiento de archivos)
- Nodemailer (Envío de correos)
- JWT (Autenticación)
- Bcrypt (Encriptación de contraseñas)
- Swagger (Documentación de API)
- Jest (Testing framework)
- Supertest (HTTP testing)
- MongoDB Memory Server (Testing database)

## Scripts útiles
- `npm run dev` — Ejecuta el servidor en modo desarrollo con nodemon
- `npm run build` — Compila el proyecto a JavaScript
- `npm start` — Ejecuta el servidor en producción
- `npm test` — Ejecuta todos los tests
- `npm run test:watch` — Ejecuta los tests en modo watch
- `npm run test:coverage` — Ejecuta los tests con reporte de cobertura

## Testing

El proyecto incluye una suite completa de tests que cubre todas las funcionalidades principales:

### Ejecutar Tests
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests específicos
npm test auth.controller.test.ts
npm test user.controller.test.ts
```

### Cobertura de Tests
La suite de tests incluye:

#### Controladores
- **Auth Controller**
  - Registro de usuarios
  - Inicio de sesión con email/contraseña
  - Login con Google OAuth
  - Verificación de email
  - Recuperación de contraseña
  - Manejo de errores y validaciones

- **User Controller**
  - Obtener todos los usuarios
  - Buscar usuarios por query
  - Obtener usuario por ID
  - Obtener perfil del usuario actual
  - Actualizar información del usuario
  - Eliminar usuario
  - Validación de datos

#### Middlewares y Utilidades
- **Auth Middleware**
  - Verificación de tokens JWT
  - Manejo de tokens inválidos o expirados
  - Protección de rutas

- **Mail Utils**
  - Envío de correos de verificación
  - Envío de correos de recuperación de contraseña
  - Manejo de errores SMTP

- **Validation Tests**
  - Validación de formatos de email
  - Validación de campos requeridos
  - Validación de tipos de datos

#### Flujos de Integración
- **Integration Workflows**
  - Flujo completo de registro y verificación
  - Flujo de login y autenticación
  - Flujo de recuperación de contraseña

### Configuración de Testing
Los tests utilizan:
- **Jest** como framework de testing
- **Supertest** para testing de endpoints HTTP
- **MongoDB Memory Server** para base de datos en memoria
- **Mocking** completo de dependencias externas
- **Setup y teardown** automático de base de datos

### Estadísticas Actuales
- **8 suites de tests**
- Auth Controller Tests
- Auth Middleware Tests
- User Controller Tests
- Mail Utils Tests
- Validation Tests
- Integration Workflows Tests
- Utils Tests
- Cobertura de funcionalidades principales

## Estructura del proyecto

```
src/
  index.ts
  socket.ts
  app/
    routes.ts
    auth/
    users/
    groups/
    communities/
    messages/
    tasks/
    notifications/
    middlewares/
    interfaces/
  config/
    mediasoup.config.ts
  database/
    index.ts
  services/
    mediasoup.service.ts
    room.service.ts
tests/
  auth.controller.test.ts
  auth.middleware.test.ts
  user.controller.test.ts
  mail.utils.test.ts
  validation.test.ts
  integration.workflows.test.ts
  utils.test.ts
  setup.ts
```

## Documentación Swagger
Puedes consultar y probar los endpoints desde la interfaz Swagger en:
```
http://localhost:3000/swagger
```

## Variables de entorno

| Variable               | Descripción                                    |
|------------------------|------------------------------------------------|
| PORT                   | Puerto en el que corre el servidor (3000)      |
| MONGO_URI              | URI de conexión a MongoDB                      |
| JWT_SECRET             | Palabra clave para encriptar tokens JWT        |
| S3_ACCESS_KEY          | Access key de AWS S3                           |
| S3_SECRET_KEY          | Secret key de AWS S3                           |
| S3_REGION              | Región de AWS S3                               |
| GOOGLE_ID              | Client ID de Google OAuth                      |
| GOOGLE_CLIENT_ID       | Client ID de Google OAuth                      |
| FRONTEND_URL           | URL del frontend (sin / al final)              |
| FROM_EMAIL             | Email remitente para correos del sistema       |
| SMTP_HOST              | Host del servidor SMTP                         |
| SMTP_PORT              | Puerto del servidor SMTP                       |
| SMTP_SECURE            | Usar SSL/TLS (true/false)                      |
| SMTP_USER              | Usuario para autenticación SMTP                |
| SMTP_PASS              | Contraseña para autenticación SMTP             |
| MEDIASOUP_LISTEN_IP    | IP donde Mediasoup escucha (0.0.0.0)           |
| MEDIASOUP_ANNOUNCED_IP | IP pública anunciada para Mediasoup            |
| MEDIASOUP_MIN_PORT     | Puerto mínimo para RTP (10000)                 |
| MEDIASOUP_MAX_PORT     | Puerto máximo para RTP (10100)                 |
