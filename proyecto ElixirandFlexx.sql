CREATE DATABASE ElixirAndFlexx;
USE ElixirAndFlexx;

-- Roles del sistema 
CREATE TABLE Roles (
  idRol       INT           AUTO_INCREMENT PRIMARY KEY,
  nombreRol   VARCHAR(50)   NOT NULL UNIQUE,  -- 'cliente','admin',
  descripcion VARCHAR(255)
);

-- Permisos del sistema
CREATE TABLE Permisos (
  idPermiso       INT           AUTO_INCREMENT PRIMARY KEY,
  codigoPermiso   VARCHAR(100)  NOT NULL UNIQUE,  -- 'productos.crear', 'pedidos.ver',
  descripcion     VARCHAR(255)
);

-- Qué permisos tiene cada rol (Muchos a Muchos)
CREATE TABLE RolPermisos (
  idRol     INT NOT NULL,
  idPermiso INT NOT NULL,
  PRIMARY KEY (idRol, idPermiso),
  FOREIGN KEY (idRol)     REFERENCES Roles(idRol)     ON DELETE CASCADE,
  FOREIGN KEY (idPermiso) REFERENCES Permisos(idPermiso) ON DELETE CASCADE
);

-- Usuarios del sistema (clientes y staff)
CREATE TABLE Usuarios (
  idUsuarios        INT           AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL,
  apellido          VARCHAR(100)  NOT NULL,
  edad              INT,
  email             VARCHAR(150)  NOT NULL UNIQUE,
  contraseña        VARCHAR(255)  NOT NULL,
  telefono          VARCHAR(20),
  fotoPerfil        VARCHAR(500),
  idRol             INT           NOT NULL DEFAULT 1,          -- FK a Roles
  estado            ENUM('activo','suspendido','baneado')      DEFAULT 'activo',
  emailVerificado   BOOLEAN       DEFAULT FALSE,
  tokenVerificacion VARCHAR(255),  -- para link de verificación email
  fechaRegistro     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idRol) REFERENCES Roles(idRol)
);

-- Sesiones activas (para logout global, detección de sesiones sospechosas)
CREATE TABLE Sesiones (
  idSesion      INT           AUTO_INCREMENT PRIMARY KEY,
  idUsuarios    INT           NOT NULL,
  tokenSesion   VARCHAR(500)  NOT NULL UNIQUE,    -- JWT o token opaco
  fechaCreacion TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  fechaExpira   TIMESTAMP     NOT NULL,
  activa        BOOLEAN       DEFAULT TRUE,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE CASCADE
);

-- Recuperación de contraseña
CREATE TABLE RecuperacionPassword (
  idRecuperacion  INT           AUTO_INCREMENT PRIMARY KEY,
  idUsuarios      INT           NOT NULL,
  token           VARCHAR(255)  NOT NULL UNIQUE,
  fechaExpira     TIMESTAMP     NOT NULL,
  usado           BOOLEAN       DEFAULT FALSE,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE CASCADE
);

-- Direcciones del cliente
CREATE TABLE Direcciones (
  idDirecciones     INT           AUTO_INCREMENT PRIMARY KEY,
  idUsuarios        INT           NOT NULL,
  alias             VARCHAR(50)   DEFAULT 'Casa',   -- 'Casa', 'Oficina', etc.
  calle             VARCHAR(255)  NOT NULL,
  ciudad            VARCHAR(100)  NOT NULL,
  departamento      VARCHAR(100)  NOT NULL,
  barrio            VARCHAR(100),
  codigoPostal      VARCHAR(10),
  indicaciones      TEXT,
  esPredeterminada  BOOLEAN       DEFAULT FALSE,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE CASCADE
);

-- ============================================================
-- ▓▓ BLOQUE 2: CATÁLOGO, STOCK Y PRECIOS
-- ▓▓ Por qué: El catálogo debe soportar múltiples imágenes,
--    historial de precios y búsqueda por tags/filtros.
-- ============================================================

CREATE TABLE Categorias (
  idCategorias      INT           AUTO_INCREMENT PRIMARY KEY,
  nombreCategoria   VARCHAR(100)  NOT NULL UNIQUE,
  slug              VARCHAR(100)  NOT NULL UNIQUE,  -- para URLs: /catalogo/hoodies
  icono             VARCHAR(255),                   -- URL del icono de categoría
  activa            BOOLEAN       DEFAULT TRUE,
  orden             INT           DEFAULT 0          -- para ordenar en el menú
);

CREATE TABLE Productos (
  idProducto            INT             AUTO_INCREMENT PRIMARY KEY,
  nombreProducto        VARCHAR(150)    NOT NULL,
  slug                  VARCHAR(150)    NOT NULL UNIQUE,  -- URL amigable
  descripcion           TEXT            NOT NULL,
  precioBase            DECIMAL(10,2)   NOT NULL,
  esNuevo               BOOLEAN         DEFAULT TRUE,
  esDestacado           BOOLEAN         DEFAULT FALSE,    -- para sección "Featured"
  idCategorias          INT,
  origen                VARCHAR(100)    DEFAULT 'Bucaramanga, Colombia',
  material              VARCHAR(255),                     -- '100% Algodón fleece 380GSM'
  instruccionesLavado   VARCHAR(255),
  peso                  DECIMAL(6,2),                     -- en gramos, útil para calcular envío
  activo                BOOLEAN         DEFAULT TRUE,
  totalVentas           INT             DEFAULT 0,        -- desnormalizado para ranking rápido
  fechaCreacion         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idCategorias) REFERENCES Categorias(idCategorias)
);

-- Historial de precios (nunca pierdas cuándo costaba qué)
CREATE TABLE HistorialPrecios (
  idHistorial   INT             AUTO_INCREMENT PRIMARY KEY,
  idProducto    INT             NOT NULL,
  precioAnterior DECIMAL(10,2)  NOT NULL,
  precioNuevo    DECIMAL(10,2)  NOT NULL,
  cambiadoPor    INT,                                     -- idUsuarios del admin que lo cambió
  fechaCambio    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idProducto)  REFERENCES Productos(idProducto),
  FOREIGN KEY (cambiadoPor) REFERENCES Usuarios(idUsuarios)
);

-- Variantes con talla, color y SKU propio
CREATE TABLE VariantesProducto (
  idVariantes   INT                               AUTO_INCREMENT PRIMARY KEY,
  idProducto    INT                               NOT NULL,
  talla         ENUM('XS','S','M','L','XL','XXL') NOT NULL,
  color         VARCHAR(50)                       NOT NULL DEFAULT 'Único',
  stock         INT                               NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE KEY uq_variante (idProducto, talla, color),
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE
);

-- Movimientos de inventario (cada entrada/salida queda registrada)
CREATE TABLE MovimientosInventario (
  idMovimiento  INT           AUTO_INCREMENT PRIMARY KEY,
  idVariantes   INT           NOT NULL,
  tipoMovimiento ENUM('entrada','salida','ajuste','devolucion') NOT NULL,
  cantidad      INT           NOT NULL,
  stockAntes    INT           NOT NULL,
  stockDespues  INT           NOT NULL,
  motivo        VARCHAR(255),                   -- 'Venta #1023', 'Ajuste manual', 'Drop 001'
  idUsuarios    INT,                            -- quién hizo el movimiento
  fecha         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idVariantes)  REFERENCES VariantesProducto(idVariantes),
  FOREIGN KEY (idUsuarios)   REFERENCES Usuarios(idUsuarios)
);

CREATE TABLE ImagenesProducto (
  idImagen    INT           AUTO_INCREMENT PRIMARY KEY,
  idProducto  INT           NOT NULL,
  urlImagen   VARCHAR(500)  NOT NULL,
  altText     VARCHAR(255),                     -- accesibilidad y SEO
  esPrincipal BOOLEAN       DEFAULT FALSE,
  orden       INT           DEFAULT 0,
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE
);

-- Tags para búsqueda y filtros (streetwear, oversized, limited, etc.)
CREATE TABLE Tags (
  idTag       INT           AUTO_INCREMENT PRIMARY KEY,
  nombreTag   VARCHAR(50)   NOT NULL UNIQUE,
  slug        VARCHAR(50)   NOT NULL UNIQUE
);

CREATE TABLE ProductoTags (
  idProducto  INT NOT NULL,
  idTag       INT NOT NULL,
  PRIMARY KEY (idProducto, idTag),
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE,
  FOREIGN KEY (idTag)      REFERENCES Tags(idTag)           ON DELETE CASCADE
);

-- ============================================================
-- ▓▓ BLOQUE 3: MARKETING Y DROPS
-- ▓▓ Por qué: Los drops son el core del negocio streetwear.
--    Los cupones y ventas flash mueven el stock.
-- ============================================================

-- Drops / Lanzamientos (colecciones limitadas)
CREATE TABLE Lanzamientos (
  idLanzamientos  INT           AUTO_INCREMENT PRIMARY KEY,
  nombreDrop      VARCHAR(100)  NOT NULL,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  descripcion     TEXT,
  fechaApertura   DATETIME      NOT NULL,
  fechaCierre     DATETIME,
  bannerUrl       VARCHAR(500)  NOT NULL,
  estado          ENUM('borrador','activo','agotado','inactivo') DEFAULT 'borrador',
  limitePorUsuario INT          DEFAULT 2,    -- máx. 2 piezas por cliente en el drop
  fechaCreacion   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Qué productos pertenecen a un drop
CREATE TABLE LanzamientoProductos (
  idLanzamientos  INT NOT NULL,
  idProducto      INT NOT NULL,
  PRIMARY KEY (idLanzamientos, idProducto),
  FOREIGN KEY (idLanzamientos) REFERENCES Lanzamientos(idLanzamientos) ON DELETE CASCADE,
  FOREIGN KEY (idProducto)     REFERENCES Productos(idProducto)        ON DELETE CASCADE
);

-- Ventas flash con temporizador
CREATE TABLE VentasFlash (
  idFlash               INT           AUTO_INCREMENT PRIMARY KEY,
  idProducto            INT           NOT NULL,
  descuentoPorcentaje   INT           NOT NULL CHECK (descuentoPorcentaje BETWEEN 1 AND 100),
  fechaInicio           DATETIME      NOT NULL,
  fechaFin              DATETIME      NOT NULL,
  activa                BOOLEAN       DEFAULT TRUE,
  CHECK (fechaFin > fechaInicio),
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE
);

-- Lista de espera para drops (notificar cuando abra)
CREATE TABLE ListaEsperaDrop (
  idEspera        INT       AUTO_INCREMENT PRIMARY KEY,
  idLanzamientos  INT       NOT NULL,
  idUsuarios      INT,                              -- NULL si no está registrado aún
  email           VARCHAR(150) NOT NULL,
  notificado      BOOLEAN   DEFAULT FALSE,
  fechaRegistro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idLanzamientos) REFERENCES Lanzamientos(idLanzamientos),
  FOREIGN KEY (idUsuarios)     REFERENCES Usuarios(idUsuarios)
);

-- ============================================================
-- ▓▓ BLOQUE 4: INTERACCIÓN Y PRE-VENTA
-- ============================================================

CREATE TABLE Favoritos (
  idFavoritos   INT       AUTO_INCREMENT PRIMARY KEY,
  idUsuarios    INT       NOT NULL,
  idProducto    INT       NOT NULL,
  fechaAgregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_favorito (idUsuarios, idProducto),
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE CASCADE,
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE
);

CREATE TABLE Carrito (
  idCarrito   INT   AUTO_INCREMENT PRIMARY KEY,
  idUsuarios  INT   NOT NULL,
  idVariantes INT   NOT NULL,
  cantidad    INT   NOT NULL CHECK (cantidad > 0),
  fechaAgregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_carrito (idUsuarios, idVariantes),
  FOREIGN KEY (idUsuarios)  REFERENCES Usuarios(idUsuarios)             ON DELETE CASCADE,
  FOREIGN KEY (idVariantes) REFERENCES VariantesProducto(idVariantes)   ON DELETE CASCADE
);

-- ============================================================
-- ▓▓ BLOQUE 5: PAGOS Y TRANSACCIONES
-- ▓▓ Por qué: Los pagos NUNCA deben guardarse en la misma
--    tabla que el pedido. Necesitas trazabilidad completa.
-- ============================================================

CREATE TABLE Pedidos (
  idPedidos       INT             AUTO_INCREMENT PRIMARY KEY,
  numeroPedido    VARCHAR(20)     NOT NULL UNIQUE,  -- 'EF-2025-000001' legible para el cliente
  idUsuarios      INT             NOT NULL,
  idDirecciones   INT             NOT NULL,
  idLanzamientos  INT,
  subtotal        DECIMAL(10,2)   NOT NULL,
  costoEnvio      DECIMAL(10,2)   NOT NULL DEFAULT 0,
  total           DECIMAL(10,2)   NOT NULL,
  estadoPedido    ENUM(
    'pago pendiente',
    'pago confirmado',
    'preparando envio',
    'enviado',
    'entregado',
    'en devolucion',
    'cancelado',
    'reembolsado'
  ) DEFAULT 'pago pendiente',
  notasCliente    TEXT,           -- instrucciones especiales del cliente
  fechaPedido     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  fechaActualizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuarios)     REFERENCES Usuarios(idUsuarios),
  FOREIGN KEY (idDirecciones)  REFERENCES Direcciones(idDirecciones),
  FOREIGN KEY (idLanzamientos) REFERENCES Lanzamientos(idLanzamientos)
);

-- Pagos separados del pedido (un pedido puede tener varios intentos)
CREATE TABLE Pagos (
  idPago            INT             AUTO_INCREMENT PRIMARY KEY,
  idPedidos         INT             NOT NULL,
  metodoPago        ENUM('PSE','nequi','daviplata','efecty','contraentrega') NOT NULL,
  estadoPago        ENUM('pendiente','aprobado','rechazado','reembolsado') DEFAULT 'pendiente',
  monto             DECIMAL(10,2)   NOT NULL,
  fechaPago         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idPedidos) REFERENCES Pedidos(idPedidos)
);

CREATE TABLE DetallePedidos (
  idDetallePedidos  INT             AUTO_INCREMENT PRIMARY KEY,
  idPedidos         INT             NOT NULL,
  idVariantes       INT             NOT NULL,
  cantidad          INT             NOT NULL CHECK (cantidad > 0),
  tallaSnapshot     VARCHAR(10)     NOT NULL,    -- protege el historial
  colorSnapshot     VARCHAR(50)     NOT NULL,    -- protege el historial
  nombreSnapshot    VARCHAR(150)    NOT NULL,    -- nombre del producto al momento de comprar
  precioUnitario    DECIMAL(10,2)   NOT NULL,    -- precio al momento de comprar
  FOREIGN KEY (idPedidos)   REFERENCES Pedidos(idPedidos),
  FOREIGN KEY (idVariantes) REFERENCES VariantesProducto(idVariantes)
);

-- Rastreo del envío con historial de estados
CREATE TABLE RastreoEnvio (
  idRastreo       INT           AUTO_INCREMENT PRIMARY KEY,
  idPedidos       INT           NOT NULL,
  transportadora  VARCHAR(100),
  numeroGuia      VARCHAR(100),
  estadoEnvio     VARCHAR(100)  NOT NULL,         -- 'En bodega Bogotá', 'En reparto', etc.
  descripcion     TEXT,
  fechaEstado     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idPedidos) REFERENCES Pedidos(idPedidos)
);

-- ============================================================
-- ▓▓ BLOQUE 6: POST-VENTA Y SOPORTE
-- ============================================================

CREATE TABLE Reseñas (
  idReseñas           INT       AUTO_INCREMENT PRIMARY KEY,
  idProducto          INT       NOT NULL,
  idUsuarios          INT       NOT NULL,
  puntuacionEstrellas INT       NOT NULL CHECK (puntuacionEstrellas BETWEEN 1 AND 5),
  titulo              VARCHAR(150),
  comentario          TEXT,
  fecha               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reseña (idProducto, idUsuarios),
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto),
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios)
);

CREATE TABLE Devoluciones (
  idDevolucion      INT       AUTO_INCREMENT PRIMARY KEY,
  idPedidos         INT       NOT NULL,
  idUsuarios        INT       NOT NULL,
  motivoDevolucion  TEXT      NOT NULL,
  evidenciaFoto1    VARCHAR(500),
  evidenciaFoto2    VARCHAR(500),
  estadoSolicitud   ENUM('recibida','en proceso','aprobada','rechazada','completada') DEFAULT 'recibida',
  respuestaAdmin    TEXT,                            -- explicación del admin al cliente
  fechaSolicitud    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechaResolucion   TIMESTAMP NULL,
  FOREIGN KEY (idPedidos)  REFERENCES Pedidos(idPedidos),
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios)
);

-- Reembolsos asociados a devoluciones
CREATE TABLE Reembolsos (
  idReembolso     INT             AUTO_INCREMENT PRIMARY KEY,
  idDevolucion    INT             NOT NULL,
  monto           DECIMAL(10,2)   NOT NULL,
  metodo          VARCHAR(100)    NOT NULL,    -- 'PSE reverso', 'Bono tienda', etc.
  estado          ENUM('pendiente','procesado','fallido') DEFAULT 'pendiente',
  referencia      VARCHAR(255),
  fechaReembolso  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idDevolucion) REFERENCES Devoluciones(idDevolucion)
);

-- ============================================================
-- ▓▓ BLOQUE 7: NOTIFICACIONES
-- ▓▓ Por qué: Sin esto no hay forma de avisar al cliente
--    que su pedido cambió de estado.
-- ============================================================

CREATE TABLE Notificaciones (
  idNotificacion  INT           AUTO_INCREMENT PRIMARY KEY,
  idUsuarios      INT           NOT NULL,
  tipo            ENUM(
    'pedido_confirmado',
    'pedido_enviado',
    'pedido_entregado',
    'drop_abierto',
    'venta_flash',
    'devolucion_actualizada',
    'cupon_disponible',
    'soporte_respuesta',
    'stock_agotandose'
  ) NOT NULL,
  titulo          VARCHAR(150)  NOT NULL,
  mensaje         TEXT          NOT NULL,
  urlRedireccion  VARCHAR(500),              -- '/mis-pedidos/EF-2025-000001'
  leida           BOOLEAN       DEFAULT FALSE,
  fechaCreacion   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE CASCADE
);

-- ============================================================
-- ▓▓ BLOQUE 8: ANALYTICS Y MÉTRICAS
-- ▓▓ Por qué: Sin datos no hay decisiones. El admin necesita
--    saber qué vende, qué se mira y qué se abandona.
-- ============================================================

-- Qué páginas/productos visitan los usuarios
CREATE TABLE VisitasProducto (
  idVisita    INT   AUTO_INCREMENT PRIMARY KEY,
  idProducto  INT   NOT NULL,
  idUsuarios  INT,                    -- NULL si no está logueado
  sessionId   VARCHAR(255),           -- para agrupar visitas anónimas
  fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idProducto) REFERENCES Productos(idProducto) ON DELETE CASCADE,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios)
);

-- Carritos abandonados (para recuperación por email)
CREATE TABLE CarritosAbandonados (
  idAbandonado  INT       AUTO_INCREMENT PRIMARY KEY,
  idUsuarios    INT,
  email         VARCHAR(150),
  itemsJSON     JSON      NOT NULL,   -- snapshot del carrito al momento de abandonar
  totalEstimado DECIMAL(10,2),
  emailEnviado  BOOLEAN   DEFAULT FALSE,
  fechaAbandono TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios)
);

-- Búsquedas realizadas en la tienda (para saber qué buscan y no encuentran)
CREATE TABLE BusquedasRegistradas (
  idBusqueda    INT           AUTO_INCREMENT PRIMARY KEY,
  idUsuarios    INT,
  terminoBusqueda VARCHAR(255) NOT NULL,
  resultados    INT           DEFAULT 0,
  fecha         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuarios) REFERENCES Usuarios(idUsuarios)
);


-- ============================================================
-- ▓▓ BLOQUE 9: CONFIGURACIÓN GLOBAL
-- ============================================================

CREATE TABLE ConfiguracionGlobal (
  idConfig              INT           AUTO_INCREMENT PRIMARY KEY,
  clave                 VARCHAR(100)  NOT NULL UNIQUE,
  valor                 TEXT          NOT NULL,
  tipo                  ENUM('texto','numero','booleano','json') DEFAULT 'texto',
  descripcion           VARCHAR(255),
  esPublica             BOOLEAN       DEFAULT FALSE,   -- TRUE: el frontend puede leerla
  ultimaActualizacion   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- ▓▓ INSERT INTO: DATOS BASE DEL SISTEMA
-- ============================================================

-- Roles
INSERT INTO Roles (nombreRol, descripcion) VALUES
  ('cliente',         'Usuario final que compra en la tienda'),
  ('administrador',   'Gestión completa del catálogo y pedidos');
 
-- Permisos atómicos
INSERT INTO Permisos (codigoPermiso, descripcion) VALUES
  -- Productos
  ('productos.ver',        'Ver catálogo de productos'),
  ('productos.crear',      'Crear nuevos productos'),
  ('productos.editar',     'Editar productos existentes'),
  ('productos.eliminar',   'Eliminar/desactivar productos'),
  -- Pedidos
  ('pedidos.ver',          'Ver todos los pedidos'),
  ('pedidos.actualizar',   'Actualizar estado de pedidos'),
  -- Usuarios
  ('usuarios.ver',         'Ver listado de usuarios'),
  ('usuarios.banear',      'Suspender o banear usuarios'),
  -- Inventario
  ('inventario.ver',       'Ver movimientos de inventario'),
  ('inventario.ajustar',   'Hacer ajustes manuales de stock'),
  -- Configuración
  ('config.editar',        'Editar configuración global'),
  -- Reportes
  ('reportes.ver',         'Ver analytics y reportes');

-- Asignar permisos por rol
-- Administrador: todo excepto config
INSERT INTO RolPermisos (idRol, idPermiso)
SELECT 2, idPermiso FROM Permisos WHERE codigoPermiso != 'config.editar';

-- Categorías
INSERT INTO Categorias (nombreCategoria, slug, orden) VALUES
  ('HOODIES',  'hoodies',     1),
  ('CAMISAS',  't-shirts',     2),
  ('SUDADERAS',  'cargo-pants',    3),
  ('ZAPATOS',  'zapatos',     4),
  ('HOODIES Y SUDADERA',  'jackets',      5),
  ('PANTALONETAS',  'pants',    6),
  ('CONJUNTOS',   'drops',      7),
  ('EDICION LIMITADA',   'edition',      8);

-- Tags
INSERT INTO Tags (nombreTag, slug) VALUES
  ('Streetwear',      'streetwear'),
  ('Oversized',       'oversized'),
  ('Limited Edition', 'limited-edition'),
  ('Drop',            'drop'),
  ('Nuevo',           'nuevo'),
  ('Sale',            'sale'),
  ('Bestseller',      'bestseller');

-- Configuración global
INSERT INTO ConfiguracionGlobal (clave, valor, tipo, descripcion, esPublica) VALUES
  ('costo_envio_local',     '8000',                         'numero',   'Envío Bucaramanga en COP',           TRUE),
  ('costo_envio_nacional',  '12000',                        'numero',   'Envío nacional en COP',              TRUE),
  ('envio_gratis_desde',    '200000',                       'numero',   'Monto mínimo envío gratis COP',      TRUE),
  ('moneda',                'COP',                          'texto',    'Moneda principal',                   TRUE),
  ('nombre_tienda',         'ElixirAndFlexx',               'texto',    'Nombre comercial',                   TRUE),
  ('ciudad_origen',         'Bucaramanga, Colombia',        'texto',    'Ciudad de despacho',                 TRUE),
  ('email_soporte',         'carrilloriverasantiago@gmail.com',  'texto',    'Email de soporte',              TRUE),
  ('dias_devolucion',       '15',                           'numero',   'Días para aceptar devoluciones',     TRUE),
  ('max_items_carrito',     '10',                           'numero',   'Máximo ítems distintos en carrito',  TRUE),
  ('max_items_por_drop',    '2',                            'numero',   'Piezas máx. por usuario en un drop', TRUE),
  ('mantenimiento',         'false',                        'booleano', 'Activar modo mantenimiento',         FALSE),
  ('smtp_host',             'smtp.gmail.com',               'texto',    'Servidor de correo',                 FALSE);

-- Admin principal
INSERT INTO Usuarios (nombre, apellido, edad, email, contraseña, telefono, idRol, emailVerificado) VALUES
  ('Admin', 'ElixirAndFlexx', 18, 'carrilloriverasantiago@gmail.com', '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT', '3009876543', 2, TRUE);

-- Usuarios de prueba (clientes)
INSERT INTO Usuarios (nombre, apellido, edad, email, contraseña, telefono, emailVerificado) VALUES
  ('Santiago',  'Pérez',   22, 'santi@gmail.com',  '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT', '3109876543', TRUE),
  ('Valentina', 'Torres',  20, 'vale@gmail.com',   '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT', '3201112233', TRUE),
  ('Juan',      'Ruiz',    24, 'juanc@gmail.com',  '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT', '3054445566', TRUE);

-- Producto de prueba
INSERT INTO Productos (nombreProducto, slug, descripcion, precioBase, esNuevo, esDestacado, idCategorias, material, peso) VALUES
  (
    'Hoodie Cross Limited Edition',
    'hoodie-cross-limited-edition',
    'Hoodie oversized con estampado de cruces bordadas. Diseño exclusivo ElixirAndFlexx.',
    189000.00, TRUE, TRUE, 1, '100% Algodón fleece 380GSM', 650.00
  ),
  (
    'Cargo Pant Street Black',
    'cargo-pant-street-black',
    'Pantalón cargo con múltiples bolsillos funcionales. Corte recto tela ripstop.',
    215000.00, FALSE, FALSE, 3, 'Ripstop 65% Poliéster 35% Algodón', 450.00
  );

-- Variantes del Hoodie
INSERT INTO VariantesProducto (idProducto, talla, color, stock) VALUES
  (1,  'S',  'Negro',  15),
  (1,  'M',  'Negro',  20),
  (1,  'L',  'Negro',  18),
  (1,  'XL', 'Negro',  10),
  (1,  'S',  'Blanco',  8),
  (1,  'M',  'Blanco', 12);

-- Variantes del Cargo Pant
INSERT INTO VariantesProducto (idProducto, talla, color, stock) VALUES
  (2,  'S',  'Negro', 10),
  (2,  'M',  'Negro', 14),
  (2,  'L',  'Negro',  9),
  (2,  'XL', 'Negro',  5);

-- Drop de ejemplo
INSERT INTO Lanzamientos (nombreDrop, slug, descripcion, fechaApertura, fechaCierre, bannerUrl, estado, limitePorUsuario) VALUES
  ('DROP 001 — CROSS SEASON', 'drop-001-cross-season',
   'Primera colección oficial. Piezas limitadas inspiradas en el arte y la calle de Bucaramanga.',
   '2025-08-01 12:00:00', '2025-08-15 23:59:59',
   '/images/banner_drop001.jpg', 'borrador', 2);


-- ============================================================
-- ▓▓ VISTAS PARA EL FRONTEND Y PANEL ADMIN
-- ============================================================

-- Catálogo completo con precio final y stock total
-- 1. Catálogo completo
CREATE OR REPLACE VIEW vw_catalogo AS
SELECT
  p.idProducto, p.nombreProducto, p.slug, p.descripcion,
  p.precioBase, p.porcentajeDescuento,
  ROUND(p.precioBase * (1 - p.porcentajeDescuento / 100), 2)  AS precioFinal,
  p.esNuevo, p.esDestacado, p.origen, p.material,
  c.nombreCategoria, c.slug AS slugCategoria,
  (SELECT urlImagen FROM ImagenesProducto WHERE idProducto = p.idProducto AND esPrincipal = TRUE LIMIT 1) AS imagenPrincipal,
  (SELECT SUM(stock) FROM VariantesProducto WHERE idProducto = p.idProducto) AS stockTotal,
  p.totalVentas
FROM Productos p
LEFT JOIN Categorias c ON p.idCategorias = c.idCategorias
WHERE p.activo = TRUE;

-- 2. Ventas flash
CREATE OR REPLACE VIEW vw_ventas_flash_activas AS
SELECT
  vf.idFlash, p.idProducto, p.nombreProducto, p.slug,
  p.precioBase, vf.descuentoPorcentaje,
  ROUND(p.precioBase * (1 - vf.descuentoPorcentaje / 100), 2) AS precioFlash,
  vf.fechaFin,
  TIMESTAMPDIFF(SECOND, NOW(), vf.fechaFin) AS segundosRestantes
FROM VentasFlash vf
JOIN Productos p ON vf.idProducto = p.idProducto
WHERE NOW() BETWEEN vf.fechaInicio AND vf.fechaFin
  AND vf.activa = TRUE AND p.activo = TRUE;

-- 3. Carrito de compras
CREATE OR REPLACE VIEW vw_carrito_detalle AS
SELECT
  c.idCarrito, c.idUsuarios, c.cantidad,
  v.idVariantes, v.talla, v.color, v.stock AS stockDisponible,
  p.idProducto, p.nombreProducto, p.slug,
  ROUND(p.precioBase * (1 - p.porcentajeDescuento / 100), 2) AS precioUnitario,
  ROUND(p.precioBase * (1 - p.porcentajeDescuento / 100) * c.cantidad, 2) AS subtotalLinea,
  (SELECT urlImagen FROM ImagenesProducto WHERE idProducto = p.idProducto AND esPrincipal = TRUE LIMIT 1) AS imagen
FROM Carrito c
JOIN VariantesProducto v ON c.idVariantes = v.idVariantes
JOIN Productos p ON v.idProducto = p.idProducto
WHERE p.activo = TRUE;

-- 4. Mis Pedidos
CREATE OR REPLACE VIEW vw_mis_pedidos AS
SELECT
  p.idPedidos, p.numeroPedido, p.total, p.estadoPedido,
  p.fechaPedido, p.idUsuarios,
  COUNT(dp.idDetallePedidos) AS totalItems,
  pg.estadoPago, pg.metodoPago
FROM Pedidos p
LEFT JOIN DetallePedidos dp ON p.idPedidos = dp.idPedidos
LEFT JOIN Pagos pg ON p.idPedidos = pg.idPedidos AND pg.estadoPago = 'aprobado'
GROUP BY p.idPedidos, p.numeroPedido, p.total, p.estadoPedido,
         p.fechaPedido, p.idUsuarios, pg.estadoPago, pg.metodoPago;

-- 5. Alertas de Stock Bajo
CREATE OR REPLACE VIEW vw_alertas_stock AS
SELECT
  p.nombreProducto, p.slug, v.sku, v.talla, v.color,
  v.stock, v.stockMinimo,
  (v.stockMinimo - v.stock) AS unidadesFaltantes
FROM VariantesProducto v
JOIN Productos p ON v.idProducto = p.idProducto
WHERE v.stock <= v.stockMinimo AND p.activo = TRUE
ORDER BY unidadesFaltantes DESC;

-- 6. Top Productos
CREATE OR REPLACE VIEW vw_top_productos AS
SELECT
  p.idProducto, p.nombreProducto, p.slug,
  p.totalVentas,
  COALESCE(AVG(r.puntuacionEstrellas), 0) AS promedioEstrellas,
  COUNT(r.idReseñas) AS totalReseñas
FROM Productos p
LEFT JOIN Reseñas r ON p.idProducto = r.idProducto
WHERE p.activo = TRUE
GROUP BY p.idProducto, p.nombreProducto, p.slug, p.totalVentas
ORDER BY p.totalVentas DESC;

show tables from ElixirAndFlexx;
select * from Usuarios;
SELECT idUsuarios, email, password FROM Usuarios LIMIT 5;
select nombre from Usuarios;

-- ============================================================
-- FIN DEL SCRIPT v2.0
-- ============================================================