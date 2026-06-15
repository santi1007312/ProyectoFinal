USE ElixirAndFlexx;

-- 1. Agregar la columna faltante en Productos para que funcionen las vistas de precios
ALTER TABLE Productos 
ADD COLUMN porcentajeDescuento INT NOT NULL DEFAULT 0 AFTER precioBase;

-- 2. Agregar las columnas faltantes en VariantesProducto para las alertas de stock
ALTER TABLE VariantesProducto 
ADD COLUMN sku VARCHAR(50) NULL AFTER idProducto,
ADD COLUMN stockMinimo INT NOT NULL DEFAULT 5;

-- 3. Agregar la columna faltante en Reseñas para el filtro del Top de Productos
ALTER TABLE Reseñas 
ADD COLUMN aprobada BOOLEAN DEFAULT TRUE AFTER comentario;

-- 4 cambio de estilo de contraseña a texto plano
ALTER TABLE Usuarios
CHANGE contraseña password VARCHAR(100) NOT NULL;


-- ============================================================
-- ▓▓ LA NUEVA INFORMACIÓN (Los datos que hacían falta)
-- ============================================================

-- Actualizamos el descuento del Cargo Pant (ID 2)
UPDATE Productos 
SET porcentajeDescuento = 10 
WHERE idProducto = 2;

-- Le ponemos los códigos SKU a las variantes que ya tenía registradas
-- Para el Hoodie (ID Producto 1)
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-S'  WHERE idProducto = 1 AND talla = 'S'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-M'  WHERE idProducto = 1 AND talla = 'M'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-L'  WHERE idProducto = 1 AND talla = 'L'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-BLK-XL' WHERE idProducto = 1 AND talla = 'XL' AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'HD-CRS-WHT-S'  WHERE idProducto = 1 AND talla = 'S'  AND color = 'Blanco';
UPDATE VariantesProducto SET sku = 'HD-CRS-WHT-M'  WHERE idProducto = 1 AND talla = 'M'  AND color = 'Blanco';

-- Para el Cargo Pant (ID Producto 2)
UPDATE VariantesProducto SET sku = 'CG-STB-BLK-S'  WHERE idProducto = 2 AND talla = 'S'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'CG-STB-BLK-M'  WHERE idProducto = 2 AND talla = 'M'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'CG-STB-BLK-L'  WHERE idProducto = 2 AND talla = 'L'  AND color = 'Negro';
UPDATE VariantesProducto SET sku = 'CG-STB-BLK-XL' WHERE idProducto = 2 AND talla = 'XL' AND color = 'Negro';

-- 1. Asegurémonos de que el correo quede bien en minúsculas
UPDATE Usuarios 
SET email = 'carrilloriverasantiago@gmail.com' 
WHERE idUsuarios = 1;

-- 2. Quemarle un hash de BCrypt real para la contraseña (esta encripta la palabra 'admin123')
UPDATE Usuarios 
SET contraseña = '$2a$10$eX7Eshq0f8mN9J2D7LzXPOVb3gEwGcl2vSREH3pI8QWbA0R2.0CqO' 
WHERE idUsuarios = 1;

-- 3. Si va a probar con el usuario cliente (ID 2), póngale este hash (encripta 'cliente123')
UPDATE Usuarios 
SET contraseña = '$2a$10$7Z8Kpx0C/bB2q2G5N7V2OOB0lV9EwFcl2vSREH3pI8QWbA0R2.0CqO' 
WHERE idUsuarios = 2;