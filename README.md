
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
3. Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
	```env
	PORT=3001
	MONGO_URI=tu_mongo_uri
	JWT_SECRET=tu_palabra_clave
	```
4. Inicia el servidor en modo desarrollo:
	```bash
	npm run dev
	```

## Uso
El servidor se ejecutará por defecto en `http://localhost:3001`. 

La documentación de la API está disponible en: `http://localhost:3001/swagger`

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
- `GET /teams/my-teams` — Listar equipos del usuario
- `GET /teams/{teamId}` — Obtener equipo por ID
- `GET /teams/my-teams` — Listar teams del usuario
- `GET /teams/{teamId}` — Obtener team por ID
- `POST /teams` - Crear team
- `POST /teams/add-teamate` - Añadir miembro al team
- `PUT /teams/change-team-info` - Actualizar team
- `DELETE /teams/{teamId}` - Borrar team
- `DELETE /teams/{teamId}/remove-member/{userId}` - Borrar teamate

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

## Tecnologías utilizadas
- Node.js
- TypeScript
- Express
- Mongoose (MongoDB)
- Socket.IO
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
- **Auth Controller** (11 tests)
  - Registro de usuarios
  - Inicio de sesión
  - Verificación de email
  - Recuperación de contraseña
  - Manejo de errores

- **User Controller** (18 tests)
  - Obtener todos los usuarios
  - Buscar usuarios por query
  - Obtener usuario por ID
  - Obtener perfil del usuario actual
  - Actualizar información del usuario
  - Eliminar usuario
  - Validación de datos

- **Group Controller** (26 tests)
  - Crear y gestionar grupos
  - Añadir/eliminar miembros
  - Actualizar información del grupo
  - Obtener grupos del usuario
  - Validaciones y permisos

- **Team Controller** (25 tests)
  - Crear y gestionar equipos
  - Añadir/eliminar miembros del equipo
  - Actualizar información del equipo
  - Obtener equipos del usuario
  - Validaciones y permisos

- **Task Controller** (38 tests)
  - Crear tareas
  - Obtener tareas por ID y usuario
  - Actualizar tareas
  - Eliminar tareas
  - Gestión de estados
  - Validaciones completas

- **Message Controller** (38 tests)
  - Crear mensajes
  - Obtener mensajes por grupo
  - Actualizar y eliminar mensajes
  - Sistema de reacciones
  - Paginación
  - Validaciones de permisos

### Configuración de Testing
Los tests utilizan:
- **Jest** como framework de testing
- **Supertest** para testing de endpoints HTTP
- **MongoDB Memory Server** para base de datos en memoria
- **Mocking** completo de dependencias externas
- **Setup y teardown** automático de base de datos

### Estadísticas Actuales
- **9 suites de tests**
- **156 tests en total**
- **100% de tests pasando**
- Cobertura completa de todos los controladores

## Estructura del proyecto

```
src/
  index.ts
  app/
	 users/
	 groups/
	 teams/
	 tasks/
	 messages/
	 auth/
tests/
  auth.controller.test.ts
  user.controller.test.ts
  group.controller.test.ts
  team.controller.test.ts
  task.controller.test.ts
  message.controller.test.ts
  setup/
    database.ts
    server.ts
```

## Documentación Swagger
Puedes consultar y probar los endpoints desde la interfaz Swagger en:
```
http://localhost:3001/swagger
```

## Variables de entorno

| Variable    | Descripción                        |
|------------ |------------------------------------|
| PORT        | Puerto en el que corre el servidor |
| MONGO_URI   | URI de conexión a MongoDB          |
| JWT_SECRET  | Palabra clave para encriptar
