
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
- `GET /users/user` — Listar usuarios
- `POST /users/createUser` — Crear usuario
- `GET /users/userId` — Obtener usuario por ID
- `PUT /users/updateUser` — Modificar usuario
- `DELETE /users/delteUser` — Eliminar usuario

### Grupos
- `GET /groups/my-groups` — Listar grupos del usuario
- `GET /groups/{groupId}` — Obtener grupo por ID
- ...

### Equipos
- `GET /teams/my-teams` — Listar equipos del usuario
- `GET /teams/{teamId}` — Obtener equipo por ID
- ...

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

## Scripts útiles
- `npm run dev` — Ejecuta el servidor en modo desarrollo con nodemon
- `npm run build` — Compila el proyecto a JavaScript
- `npm start` — Ejecuta el servidor en producción

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
```

## Documentación Swagger
Puedes consultar y probar los endpoints desde la interfaz Swagger en:
```
http://localhost:3001/swagger
```

## Variables de entorno

| Variable    | Descripción                        |
|------------ |------------------------------------|
| PORT        | Puerto en el que corre el servidor  |
| MONGO_URI   | URI de conexión a MongoDB          |

## Licencia
ISC