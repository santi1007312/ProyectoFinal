-- ============================================================
-- CORRECCIÓN DE CONTRASEÑAS — ElixirAndFlexx
-- Nota: Ejecuta este script en MySQL Workbench ANTES de probar el login.
-- 
-- PROBLEMA: El alter_table.sql anterior puso hashes BCrypt en la BD,
-- pero el UsuarioDao compara en texto plano.
-- SOLUCIÓN: Dejamos las contraseñas en texto plano.
-- ============================================================

USE ElixirAndFlexx;

-- 1. Contraseña del Admin (para login con: admin123)
UPDATE Usuarios 
SET contraseña = 'admin123' 
WHERE email = 'carrilloriverasantiago@gmail.com';

-- 2. Contraseña del cliente de prueba santi (para login con: cliente123)
UPDATE Usuarios 
SET contraseña = 'cliente123' 
WHERE email = 'santi@gmail.com';

-- 3. Contraseña del cliente vale (para login con: cliente123)
UPDATE Usuarios 
SET contraseña = 'cliente123' 
WHERE email = 'vale@gmail.com';

-- 4. Contraseña del cliente juanc (para login con: cliente123)
UPDATE Usuarios 
SET contraseña = 'cliente123' 
WHERE email = 'juanc@gmail.com';

-- ============================================================
-- VERIFICACIÓN: corre esto para confirmar que quedó bien
-- ============================================================
SELECT idUsuarios, nombre, email, contraseña, idRol, estado 
FROM Usuarios;

-- ============================================================
-- SCRIPT FINAL DE CORRECCIÓN — ElixirAndFlexx
-- Ejecutar en MySQL Workbench EN ESTE ORDEN exacto.
-- ============================================================

USE ElixirAndFlexx;

-- ── PASO 1: Asegurar que la columna se llame "password" ─────────────────────
-- (el alter_table anterior la renombró, este paso es idempotente si ya existe)
-- Si da error "Duplicate column name" ignóralo, ya estaba aplicado.

-- Intentamos el rename solo si la columna "contraseña" aún existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'ElixirAndFlexx'
      AND TABLE_NAME   = 'Usuarios'
      AND COLUMN_NAME  = 'contraseña'
);

-- Ejecuta el ALTER solo si existe la columna con ñ
SET @sql = IF(@col_exists > 0,
    'ALTER TABLE Usuarios CHANGE `contraseña` `password` VARCHAR(255) NOT NULL',
    'SELECT "Columna password ya existe, ok" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── PASO 2: Agregar columnas faltantes (idempotente con IF NOT EXISTS) ───────

-- porcentajeDescuento en Productos
ALTER TABLE Productos
    ADD COLUMN IF NOT EXISTS porcentajeDescuento INT NOT NULL DEFAULT 0
    AFTER precioBase;

-- sku y stockMinimo en VariantesProducto
ALTER TABLE VariantesProducto
    ADD COLUMN IF NOT EXISTS sku         VARCHAR(50) NULL   AFTER idProducto,
    ADD COLUMN IF NOT EXISTS stockMinimo INT NOT NULL DEFAULT 5;

-- aprobada en Reseñas
ALTER TABLE Reseñas
    ADD COLUMN IF NOT EXISTS aprobada BOOLEAN DEFAULT TRUE AFTER comentario;

-- ── PASO 3: Poner contraseñas en TEXTO PLANO ─────────────────────────────────
-- (El UsuarioDao compara en texto plano, sin BCrypt)

UPDATE Usuarios SET password = 'admin123'   WHERE email = 'carrilloriverasantiago@gmail.com';
UPDATE Usuarios SET password = 'cliente123' WHERE email = 'santi@gmail.com';
UPDATE Usuarios SET password = 'cliente123' WHERE email = 'vale@gmail.com';
UPDATE Usuarios SET password = 'cliente123' WHERE email = 'juanc@gmail.com';

-- Asegurar que los usuarios estén activos y emailVerificado
UPDATE Usuarios SET estado = 'activo', emailVerificado = TRUE
WHERE email IN (
    'carrilloriverasantiago@gmail.com',
    'santi@gmail.com',
    'vale@gmail.com',
    'juanc@gmail.com'
);

-- ── PASO 4: Asegurar idRol correcto ─────────────────────────────────────────
-- Roles: 1 = cliente, 2 = administrador  (ver INSERT INTO Roles del SQL principal)
UPDATE Usuarios SET idRol = 2 WHERE email = 'carrilloriverasantiago@gmail.com';
UPDATE Usuarios SET idRol = 1 WHERE email IN ('santi@gmail.com','vale@gmail.com','juanc@gmail.com');

-- ── PASO 5: Datos de prueba adicionales ──────────────────────────────────────

UPDATE Productos SET porcentajeDescuento = 10 WHERE idProducto = 2;

UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-S'  WHERE idProducto = 1 AND talla = 'S'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-M'  WHERE idProducto = 1 AND talla = 'M'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-L'  WHERE idProducto = 1 AND talla = 'L'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-XL' WHERE idProducto = 1 AND talla = 'XL' AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-WHT-S'  WHERE idProducto = 1 AND talla = 'S'  AND color = 'Blanco';

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────────────────────
SELECT idUsuarios, nombre, email,
       SUBSTRING(password, 1, 20) AS password_preview,
       idRol, estado, emailVerificado
FROM Usuarios
ORDER BY idRol;

-- ============================================================
-- CREDENCIALES PARA PROBAR:
--
--  ADMIN:
--    Email:      carrilloriverasantiago@gmail.com
--    Contraseña: admin123
--    → Redirige a interfazAdmin.html
--
--  CLIENTE:
--    Email:      santi@gmail.com
--    Contraseña: cliente123
--    → Redirige a interfazGrafica.html
-- ============================================================

