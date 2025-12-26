# Sistema Deportivo Municipal - Backend

Backend del Sistema de Gestión Deportiva para la Municipalidad de Surco - Charilla del Estanque.

## Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **Bcrypt** - Encriptación de contraseñas
- **Zod** - Validación de datos
- **Node-Cron** - Tareas programadas (check-out automático)

## Características

- **Autenticación JWT** con roles (Recepción, Admin Sede, Admin Municipal)
- **Gestión de Vecinos** con relaciones familiares
- **Billetera de Horas** con múltiples métodos de pago
- **Control de Carriles** con check-in/check-out
- **Caja Diaria** con apertura, cierre y control de diferencias
- **Check-out Automático** para consumos excedidos
- **Alertas** para saldos bajos y consumos próximos a vencer
- **Auditoría** de todas las operaciones críticas
- **Métricas y Reportes** con análisis de tendencias

## Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma      # Modelo de datos
│   └── seed.ts            # Datos iniciales
├── src/
│   ├── controllers/       # Controladores de rutas
│   ├── middleware/        # Middleware (auth, validation)
│   ├── routes/            # Definición de rutas
│   ├── services/          # Lógica de negocio
│   ├── utils/             # Utilidades
│   └── index.ts           # Punto de entrada
├── .env.example           # Variables de entorno de ejemplo
├── package.json
└── tsconfig.json
```

## Instalación

### Requisitos Previos

- Node.js 18+ y npm
- PostgreSQL 14+

### Configuración

1. Clonar el repositorio:
```bash
git clone https://github.com/carlosvidal/surco-deportes-backend.git
cd surco-deportes-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/surco_deportes"
JWT_SECRET="tu_secreto_jwt_muy_seguro"
PORT=3000
```

4. Configurar la base de datos:
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Cargar datos iniciales (usuario admin)
npm run prisma:seed
```

## Uso

### Desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

### Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar
npm start
```

### Comandos Útiles

```bash
# Abrir Prisma Studio (interfaz gráfica de la BD)
npm run prisma:studio

# Generar cliente de Prisma después de cambios en schema
npm run prisma:generate

# Crear y aplicar nueva migración
npm run prisma:migrate
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login con usuario/password
- `POST /api/auth/logout` - Cerrar sesión

### Vecinos
- `GET /api/vecinos` - Listar vecinos
- `GET /api/vecinos/:dni` - Obtener vecino por DNI
- `POST /api/vecinos` - Registrar vecino
- `PUT /api/vecinos/:dni` - Actualizar vecino
- `POST /api/vecinos/:dni/familia` - Agregar familiar
- `DELETE /api/vecinos/:dni/familia/:miembroDni` - Eliminar familiar

### Compras (Billetera de Horas)
- `POST /api/compras` - Registrar compra de horas
- `GET /api/compras/:id` - Obtener compra
- `POST /api/compras/:id/anular` - Anular compra

### Consumos (Check-in/Check-out)
- `POST /api/consumos` - Check-in (entrada)
- `POST /api/consumos/:id/salida` - Check-out (salida)
- `GET /api/consumos/activos` - Listar consumos activos
- `GET /api/consumos/alertas` - Consumos con alertas
- `POST /api/consumos/:id/anular` - Anular consumo

### Caja
- `POST /api/caja/abrir` - Abrir caja del día
- `POST /api/caja/cerrar` - Cerrar caja del día
- `GET /api/caja/actual` - Obtener caja actual
- `GET /api/caja/resumen` - Resumen de movimientos
- `GET /api/caja/historial` - Historial de cajas

### Métricas
- `GET /api/metricas/resumen` - Resumen general
- `GET /api/metricas/tendencias` - Tendencias de uso
- `GET /api/metricas/horas-pico` - Análisis de horas pico
- `GET /api/metricas/metodos-pago` - Distribución de métodos de pago

## Datos de Prueba

Después de ejecutar `npm run prisma:seed`, se crea:

**Usuario Admin:**
- Usuario: `admin`
- Contraseña: `admin123`
- Rol: ADMIN_MUNICIPAL

## Modelo de Datos

### Entidades Principales

- **Staff** - Usuarios del sistema (recepcionistas y administradores)
- **Vecino** - Vecinos registrados del distrito
- **Familia** - Relaciones familiares entre vecinos
- **Compra** - Compras de horas (billetera)
- **Consumo** - Check-in/Check-out en instalaciones
- **Caja** - Control de caja diaria
- **AuditLog** - Registro de auditoría

### Instalaciones Soportadas

- Piscina Adultos (6 carriles)
- Piscina Niños (4 carriles)
- Paddle
- Gimnasio
- Parrillas

## Seguridad

- Autenticación JWT en todas las rutas protegidas
- Contraseñas encriptadas con bcrypt
- Validación de datos con Zod
- Control de acceso basado en roles
- Auditoría completa de operaciones

## Automatización

El sistema ejecuta automáticamente:
- **Check-out automático** cada 5 minutos para consumos que excedieron su tiempo
- Las alertas se calculan en tiempo real al consultar consumos activos

## Licencia

MIT

## Autor

Municipalidad de Surco - Sistema Deportivo Municipal
