
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

Endpoints de observabilidad y especificación:
- `GET /health` — Healthcheck de disponibilidad (`{ "status": "ok", "timestamp": "..." }`, HTTP 200)
- `GET /swagger.json` — Especificación OpenAPI 3.1.0 en formato JSON (usada por OWASP ZAP API Scan)

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

### Tareas [Experimental / v2]
> **Nota de versión:** Estos endpoints forman la base del módulo de gestión de tareas colaborativas para el roadmap v2. No son consumidos por el cliente Frontend en v1, pero se encuentran aislados, protegidos por `authMiddleware` y documentados en Swagger bajo el tag `Tasks [Experimental / v2]`.

- `POST /tasks` — Crear tarea `[Experimental / v2]`
- `GET /tasks/{taskId}` — Obtener tarea por ID `[Experimental / v2]`
- `PUT /tasks/modifyTask` — Modificar tarea `[Experimental / v2]`
- `DELETE /tasks/{taskId}` — Eliminar tarea `[Experimental / v2]`

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
- `npm run test:ci` — Ejecuta la suite completa en modo CI con cobertura (`lcov` y `json-summary`)
- `npm run audit:ci` — Audita dependencias de producción (`--omit=dev --audit-level=high`)

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
- **13 suites de tests**
- Auth Controller Tests
- Auth Middleware Tests
- User Controller Tests
- Mail Utils Tests
- Validation Tests
- Integration Workflows Tests
- Utils Tests
- CORS Security Tests
- Mediasoup Config Tests
- Tasks Isolation & Documentation Tests
- Pruebas del Workflow de Release y Despliegue (`tests/deploy.workflow.test.ts`)
- Pruebas de Workflows DevSecOps y Políticas (`tests/security.workflows.test.ts`)
- Pruebas de Healthcheck y Especificación Swagger (`tests/swagger.health.test.ts`)
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
  cors.test.ts
  mediasoup.config.test.ts
  tasks.isolation.test.ts
  deploy.workflow.test.ts
  security.workflows.test.ts
  swagger.health.test.ts
  setup.ts
```

## Configuración de Producción y Networking (AWS EC2)

Para desplegar Orbit en AWS EC2 con soporte completo de videollamadas WebRTC (Mediasoup), configure los siguientes parámetros de red y entorno:

### 1. Security Groups de AWS
Mediasoup requiere que los clientes WebRTC negocien y transmitan paquetes de audio/video directamente al servidor a través de puertos UDP:
- **Puertos UDP `10000 - 10100`**: Agregar una regla de entrada (Inbound Rule) permitiendo tráfico UDP en el rango `10000-10100` desde cualquier origen (`0.0.0.0/0` en IPv4 y opcionalmente `::/0` en IPv6).
- **Puerto de la API / WebSockets (`3000` o `80`/`443` con Reverse Proxy/Nginx)**: Tráfico TCP para señalización de sockets y llamadas REST.

### 2. IP Anunciada (`MEDIASOUP_ANNOUNCED_IP`)
- En **producción**, configure la variable de entorno `MEDIASOUP_ANNOUNCED_IP` con la **Elastic IP pública** asignada a la instancia de AWS EC2.
  > **Nota**: Si se omite o se deja una IP privada, los clientes fuera de la red local de AWS no podrán completar el handshake ICE y la llamada no transmitirá medios.
- En **desarrollo local**, puede omitirse o definirse como `127.0.0.1`.

## Documentación Swagger y Healthcheck
Puedes consultar y probar los endpoints desde la interfaz Swagger o consumir el esquema OpenAPI JSON y el healthcheck:
```
http://localhost:3000/swagger
http://localhost:3000/swagger.json
http://localhost:3000/health
```

## Variables de entorno

| Variable               | Descripción                                                                              |
|------------------------|------------------------------------------------------------------------------------------|
| PORT                   | Puerto en el que corre el servidor (3000)                                                |
| MONGO_URI              | URI de conexión a MongoDB                                                                |
| JWT_SECRET             | Palabra clave para encriptar tokens JWT                                                  |
| S3_ACCESS_KEY          | Access key de AWS S3                                                                     |
| S3_SECRET_KEY          | Secret key de AWS S3                                                                     |
| S3_REGION              | Región de AWS S3                                                                         |
| GOOGLE_ID              | Client ID de Google OAuth                                                                |
| GOOGLE_CLIENT_ID       | Client ID de Google OAuth                                                                |
| FRONTEND_URL           | URL del frontend (sin / al final)                                                        |
| FROM_EMAIL             | Email remitente para correos del sistema                                                 |
| SMTP_HOST              | Host del servidor SMTP                                                                   |
| SMTP_PORT              | Puerto del servidor SMTP                                                                 |
| SMTP_SECURE            | Usar SSL/TLS (true/false)                                                                |
| SMTP_USER              | Usuario para autenticación SMTP                                                          |
| SMTP_PASS              | Contraseña para autenticación SMTP                                                       |
| MEDIASOUP_LISTEN_IP    | IP donde Mediasoup escucha localmente (0.0.0.0)                                          |
| MEDIASOUP_ANNOUNCED_IP | IP pública anunciada para WebRTC (Elastic IP en producción, 127.0.0.1 en local)          |
| MEDIASOUP_MIN_PORT     | Puerto UDP mínimo para RTP (10000, abrir en AWS Security Group)                          |
| MEDIASOUP_MAX_PORT     | Puerto UDP máximo para RTP (10100, abrir en AWS Security Group)                          |

## Arquitectura DevSecOps y CI/CD (GitHub Actions)

`Orbit-Backend` implementa una arquitectura **DevSecOps** progresiva (*Shift-Left Security*) alineada al flujo de ramas:

```text
feature / bug / docs ──▶ dev ──▶ main ──▶ release (aprobación manual en environment: production)
```

Se eliminó el despliegue automático al hacer `push` a `main` y todos los pipelines aplican política **fail-gate en severidades `HIGH` y `CRITICAL`**, usando autenticación federada vía **AWS OIDC** (sin claves estáticas ni acceso SSH).

### 1. Workflows de Seguridad y Despliegue

| Workflow | Trigger | Controles ejecutados |
|---|---|---|
| **`.github/workflows/ci-dev.yml`** | `pull_request` hacia `dev` | Validación de rama origen (bloquea `main → dev`, verifica prefijo), `npm ci && npm run build`, **TruffleHog** (`--only-verified`), **Dependency Review** (`high`), `npm audit --omit=dev --audit-level=high` y **Snyk Open Source** (SARIF). |
| **`.github/workflows/security-main.yml`** | `pull_request` hacia `main`, `push` a `main` (sin deploy), `workflow_dispatch` | Verifica origen `dev`, **Jest (`npm run test:ci`)**, **SonarCloud** (`sonar.qualitygate.wait=true`), **CodeQL** (`javascript-typescript`, `security-extended`), **Snyk Code + Snyk Container**, **Hadolint** (`Dockerfile`), **Syft** (CycloneDX + SPDX), **Grype** (`severity-cutoff: high`) y **DAST OWASP ZAP API Scan** contra `mongo:7` y `/swagger.json` (`.zap/rules.tsv`). |
| **`.github/workflows/release.yml`** | `release: [published]` y `workflow_dispatch` | Verifica ancestro en `origin/main` y tag SemVer, build multi-stage y push a **Amazon ECR** por digest inmutable `@sha256`, **Syft + Grype**, firma y attestation **Cosign Keyless (OIDC)**, **GitHub Artifact Attestations** (`attest-build-provenance` y `attest-sbom`), `SHA256SUMS.txt`, assets en GitHub Release y deploy vía **AWS SSM** tras aprobación manual en el environment `production` y re-verificación `cosign verify`. |

### 2. Matriz de Artefactos y Retención

| Workflow | Artifact | Contenido | Retención | Destino adicional |
|---|---|---|---|---|
| `ci-dev.yml` | `dev-secrets-reports` | `trufflehog-results.json` | 14 días | — |
| `ci-dev.yml` | `dev-sca-secrets-reports` | `npm-audit-report.json`, `snyk-sca.sarif` | 14 días | `snyk-sca.sarif` → GitHub Security |
| `security-main.yml` | `test-coverage-lcov` | `coverage/lcov.info`, `coverage/coverage-summary.json` | 14 días | Consumido por SonarCloud |
| `security-main.yml` | `sast-snyk-reports` | `snyk-code.sarif`, `snyk-container.sarif` | 30 días | GitHub Security (SARIF) |
| `security-main.yml` | `sbom-and-grype-reports` | `sbom-cyclonedx.json`, `sbom-spdx.json`, `grype-report.json`, `grype-results.sarif`, `hadolint-report.sarif` | 30 días | `grype` y `hadolint` → GitHub Security |
| `security-main.yml` | `dast-owasp-zap-xml` | `zap-report.xml`, `zap-report.html`, `zap-report.md` | 30 días | Resumen en `$GITHUB_STEP_SUMMARY` |
| `release.yml` | `release-supply-chain-bundle-<tag>` | `sbom-cyclonedx-<tag>.json`, `sbom-spdx-<tag>.json`, `grype-release-<tag>.json`, `cosign-verify-<tag>.json`, `SHA256SUMS.txt` | 90 días | GitHub Release + firma OCI en ECR + Attestations |

### 3. Verificación Local de Imágenes Firmadas (`cosign verify`)

Para verificar criptográficamente una imagen publicada en Amazon ECR usando Cosign Keyless (Sigstore OIDC) y GitHub Artifact Attestations:

```bash
# 1. Autenticarse en Amazon ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com

# 2. Verificar firma Cosign por digest exacto
cosign verify <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/orbit-backend@sha256:<DIGEST> \
  --certificate-identity-regexp="^https://github\.com/DRomothewriter/Orbit-Backend/\.github/workflows/release\.yml@refs/.*$" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"

# 3. Verificar provenance SLSA / SBOM con GitHub CLI
gh attestation verify oci://<ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/orbit-backend@sha256:<DIGEST> \
  --repo DRomothewriter/Orbit-Backend
```

### 4. Variables, Secretos y Apps Requeridos en GitHub

Configurar en `Settings → Secrets and variables → Actions`:

- **Secrets requeridos:**
  - `AWS_ROLE_ARN` — ARN del rol IAM federado por OIDC para ECR y SSM.
  - `EC2_INSTANCE_ID` — ID de la instancia EC2 de producción (ej. `i-0123456789abcdef0`).
  - `SNYK_TOKEN` — Token de API de Snyk (SCA, SAST y Container).
  - `SONAR_TOKEN` — Token de proyecto/usuario en SonarCloud.
- **Dependabot Secrets (`Settings → Secrets and variables → Dependabot`):**
  - `SNYK_TOKEN` — Configurar también en **Dependabot Secrets** para que los PR automáticos de `dependabot[bot]` hacia `dev` ejecuten el análisis SCA de Snyk. Si `SNYK_TOKEN` no está disponible para `dependabot[bot]`, `ci-dev.yml` omite únicamente Snyk manteniendo activos `Dependency Review` y `npm audit` (los PR de usuarios humanos siguen exigiendo `SNYK_TOKEN` fail-closed).
- **Variables opcionales:**
  - `AWS_REGION` (default: `us-east-2`)
  - `ECR_REPOSITORY` (default: `orbit-backend`)
  - `SONAR_ORGANIZATION` (default: `dromothewriter`)
  - `SONAR_PROJECT_KEY` (default: `DRomothewriter_Orbit-Backend`)
- **GitHub App:** Instalar **CodeRabbit** desde GitHub Marketplace sobre `DRomothewriter/Orbit-Backend` (utiliza `.coderabbit.yaml` en español `es-ES`).

### 5. GitHub Policy Enforcement

Las políticas de gobierno del repositorio se encuentran versionadas en el código:
- `.github/CODEOWNERS` — Exige revisión de `@DRomothewriter` en `.github/`, `Dockerfile`, `package*.json`, `.zap/`, `.coderabbit.yaml`, `sonar-project.properties`, `scripts/` y `src/app/middlewares/`.
- `.github/dependabot.yml` — Actualizaciones semanales agrupadas (`npm`, `docker`, `github-actions`) hacia la rama `dev`.
- `.github/rulesets/` — Reglas declarativas para `main` (`main-ruleset.json`), `dev` (`dev-ruleset.json`) y tags `v*` (`tags-ruleset.json`).
- `scripts/apply-github-policies.sh` — Script idempotente para aplicar rulesets, environment `production` (con aprobación manual y restricción `main`/`v*`) y alertas de seguridad vía `gh api`:

```bash
# Requiere GitHub CLI autenticado con permisos de administrador del repositorio
gh auth login
./scripts/apply-github-policies.sh DRomothewriter/Orbit-Backend
```


