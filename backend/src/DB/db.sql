-- ==================================================================
-- Creacion de la base de datos, si no existe la crea automaticamente.
-- ===================================================================
CREATE DATABASE IF NOT EXISTS casercon
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 1. Configuracion para usar la database de carsecon
use casercon;


-- ==================================================================
--                   Gestion de usuarios y permisos.
-- ===================================================================

-- 2. Creacion de la tabla de roles
CREATE TABLE roles(
	id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(40) NOT NULL UNIQUE
);

-- 3. Creacion de la tabla usuarios
CREATE TABLE usuarios(
	id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_rol INT NOT NULL,
    nombre VARCHAR(80)  NOT NULL,
    email VARCHAR(250) UNIQUE NOT NULL,
    contraseña VARCHAR(225) NOT NULL,
    codigo_recuperacion VARCHAR(6),
    codigo_expiry DATETIME NULL,
    intentos_fallidos INT DEFAULT 0,
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo',
	FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- 4. Creacion de la tabla Procesos 
CREATE TABLE procesos (
	id_proceso INT PRIMARY KEY AUTO_INCREMENT,
	nombre_proceso VARCHAR(80) NOT NULL UNIQUE
);

-- 5. Creacion de la tabla usuario_procesos
CREATE TABLE usuario_procesos (
	id_usuario_proceso INT PRIMARY KEY AUTO_INCREMENT,
    id_proceso INT NOT NULL,
    id_usuario INT NOT NULL,
	FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    
    UNIQUE(id_usuario, id_proceso)
);


-- ==================================================================
--            Gestion proveedores, pedidos, categorias de materias primas, materias primas, lotes.
-- ===================================================================

-- 6. Creacion de la tabla proveedores 
CREATE TABLE proveedores (
	id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre_proveedor VARCHAR (80) NOT NULL,
    nombre_empresa VARCHAR(80),
    email VARCHAR(250),
    telefono VARCHAR (10),
    direccion VARCHAR (80),
    estado ENUM('Activo', 'Inhabilitado') DEFAULT 'Activo',
    observaciones text NULL
);

-- 7. Creacion de la tabla pedidos 
CREATE TABLE pedidos (
	id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT NOT NULL,
    no_orden_compra VARCHAR(80),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_pedido ENUM('compra','devolucion') NOT NULL,
    fecha_entrega DATETIME,
    observaciones TEXT,
    estado ENUM('pendiente', 'recibido', 'cancelado') DEFAULT 'pendiente',
    id_usuario_creador INT NOT NULL, 
    id_usuario_receptor INT,
    id_pedido_origen INT,
    FOREIGN KEY (id_pedido_origen) REFERENCES pedidos(id_pedido),
	FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN  KEY (id_usuario_creador) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_usuario_receptor) REFERENCES usuarios(id_usuario)
);

-- 8. Creacion de categorias de materias primas
CREATE TABLE categoria_materias(
	id_categoria_materia INT PRIMARY KEY AUTO_INCREMENT,
    nombre_categoria_materia VARCHAR(100) NOT NULL UNIQUE
);

-- 9. Creacion de la tablas de materias_primas
CREATE TABLE materias_primas(
	id_materia INT PRIMARY KEY AUTO_INCREMENT,
    abreviacion VARCHAR(3) NOT NULL UNIQUE,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    id_categoria_materia INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    stock_min DECIMAL (12,2) DEFAULT 0,
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo',
    FOREIGN KEY (id_categoria_materia) REFERENCES categoria_materias(id_categoria_materia)
);

-- 10. Creacion de la tabla detalle_pedidos
CREATE TABLE detalle_pedidos (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_materia INT NOT NULL,
    cantidad_solicitada DECIMAL(12,4) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia)
);

-- 11. Creacion de la tabla lotes
CREATE TABLE lotes (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    numero_lote INT NOT NULL,
    id_detalle_pedido INT NULL,
    codigo_lote VARCHAR(50) UNIQUE NOT NULL,
    stock_inicial DECIMAL(12,4) NOT NULL,
    stock_restante DECIMAL(12,4) NOT NULL,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo','agotado') DEFAULT 'activo',
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedidos(id_detalle_pedido),
    
    UNIQUE (id_materia, numero_lote)
);


-- ==================================================================
--            Gestion de recetas y ordenes de produccion.
-- ===================================================================

-- 12. Creacion de la tabla recetas
CREATE TABLE recetas (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    estado ENUM('Activo', 'Inhabilitado') DEFAULT 'Activo' NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Creacion de la tabla detalle_receta.
CREATE TABLE detalle_receta (
    id_detalle_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_receta INT NOT NULL,
    id_materia INT NOT NULL,
    cantidad_porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_receta) REFERENCES recetas(id_receta),
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    
    UNIQUE(id_receta, id_materia)
);

-- 14. Creacion de la tabla ordenes_produccion
CREATE TABLE ordenes_produccion (
    id_orden_produccion INT AUTO_INCREMENT PRIMARY KEY,
    codigo_orden VARCHAR(20) NULL,
    id_receta INT NOT NULL,
    id_usuario_creador INT NOT NULL,
    id_usuario_inicio INT,
    id_usuario_fin INT,
    cantidad_producir DECIMAL(12,2) NOT NULL,
    observaciones TEXT,
    estado ENUM('Pendiente','En proceso','Completada') DEFAULT 'Pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion DATETIME,
    FOREIGN KEY (id_receta) REFERENCES recetas(id_receta),
	FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario),
	FOREIGN KEY (id_usuario_inicio) REFERENCES usuarios(id_usuario),
	FOREIGN KEY (id_usuario_fin) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalle_orden_produccion (
    id_detalle_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_orden_produccion INT NOT NULL,
    id_materia INT NOT NULL,
    cantidad_porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_orden_produccion) REFERENCES ordenes_produccion(id_orden_produccion),
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    UNIQUE(id_orden_produccion, id_materia)
);

-- ==================================================================
--            			Gestion de movimientos.
-- ===================================================================

-- 15. Creacion de la tabla movimientos.
CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    id_lote INT,
    id_usuario INT NOT NULL,
    tipo_movimiento ENUM('Entrada','Salida','Devolucion') NOT NULL,
    cantidad DECIMAL(12,4) NOT NULL,
    id_pedido INT,
    id_orden_produccion INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_orden_produccion) REFERENCES ordenes_produccion(id_orden_produccion)
);

DELIMITER $$

CREATE TRIGGER trg_salida_lote
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN

    IF NEW.tipo_movimiento = 'Salida' THEN
    
        UPDATE lotes
        SET stock_restante = stock_restante - NEW.cantidad
        WHERE id_lote = NEW.id_lote;
        
    END IF;

END$$

DELIMITER ;


-- ====================================================================================================================================
--            				INSERT INTO para las tablas para gestion de usuarios y procesos permitidos.
-- ======================================================================================================================================
INSERT INTO roles (nombre_rol) VALUES -- Perfecto
('Administrador'),
('Operario');

INSERT INTO usuarios (id_rol,nombre,email,contraseña,intentos_fallidos,estado) VALUES
(1,'Carlos Ramirez','admin@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u',0,'Activo'),
(2,'Ana Lopez','operario@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u',0,'Activo'),
(2,'Esteban Suarez','operario2@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u',0,'Activo');

INSERT INTO procesos (nombre_proceso) VALUES
('Recepcion'),
('Produccion');

INSERT INTO usuario_procesos (id_proceso,id_usuario) VALUES
(1,2), 
(2,2),
(1,3);

-- ====================================================================================================================================
--            					INSERT INTO para la gestion de proveedores, pedidos, materia prima, lotes.
-- ======================================================================================================================================

INSERT INTO proveedores  (nombre_proveedor,nombre_empresa,email,telefono,direccion,estado,observaciones) VALUES
('Juan Perez','Quimicos SAS','ventas@quimicos.com','3001234567','Bogota','Activo',null),
('Maria Torres','Pigmentos SA','contacto@pigmentos.com','3009876543','Medellin','Activo','vive lejos');

INSERT INTO categoria_materias (nombre_categoria_materia) VALUES
('Resinas'),
('Pigmentos'),
('Solventes');

INSERT INTO materias_primas (abreviacion,codigo,id_categoria_materia,nombre,stock_min) VALUES
('RA','RES-001',1,'Resina Acrilica',50),
('PB','PIG-001',2,'Pigmento Blanco',20),
('SI','SOL-001',3,'Solvente Industrial',30);

INSERT INTO pedidos (id_proveedor,No_orden_compra,fecha_creacion,tipo_pedido,estado,id_usuario_creador) VALUES
(1,'OC-1001',NOW(),'compra','pendiente',1);

INSERT INTO detalle_pedidos (id_pedido,id_materia,cantidad_solicitada) VALUES
(1,1,100),
(1,2,50);

INSERT INTO lotes (id_materia,id_detalle_pedido,numero_lote,codigo_lote,stock_inicial,stock_restante) VALUES
(1,1,1,'RA-001-04032026',100,100),
(2,2,1,'PB-001-04032026',50,50);

-- ====================================================================================================================================
--            								INSERT INTO para la gestion de recetas y prudccion.
-- ======================================================================================================================================

INSERT INTO recetas (nombre_producto) VALUES
('Pintura Blanca');

INSERT INTO detalle_receta (id_receta,id_materia,cantidad_porcentaje) VALUES
(1,1,10.00),
(1,2,12.00);

-- ====================================================================================================================================
-- 												INSERT INTO movimientos inventario
-- ====================================================================================================================================



-- ===================== Consultas principales y fundamentales segun las necesidades =======================================

-- CONSULTAR ORDENES DE PRODUCCION

SELECT 
  mp.id_materia,
  mp.nombre,
  ROUND(
    COALESCE(SUM(dr.cantidad_porcentaje / 100 * op.cantidad_producir), 0), 2
  ) AS stock_comprometido
FROM materias_primas mp
LEFT JOIN detalle_receta dr 
  ON dr.id_materia = mp.id_materia
LEFT JOIN ordenes_produccion op 
  ON op.id_receta = dr.id_receta
  AND op.estado IN ('Pendiente', 'En proceso')
WHERE mp.estado = 'Activo'
GROUP BY mp.id_materia, mp.nombre;

SELECT 
    op.id_orden_produccion,
    r.nombre_producto,
    
    uc.nombre AS creador_orden,
    ui.nombre AS usuario_inicio,
    uf.nombre AS usuario_fin,
    
    mp.nombre AS materia_prima,
    l.codigo_lote,
    mi.cantidad AS cantidad_usada,
    l.stock_restante

FROM ordenes_produccion op

JOIN recetas r 
ON op.id_receta = r.id_receta

JOIN usuarios uc 
ON op.id_usuario_creador = uc.id_usuario

LEFT JOIN usuarios ui 
ON op.id_usuario_inicio = ui.id_usuario

LEFT JOIN usuarios uf 
ON op.id_usuario_fin = uf.id_usuario

JOIN movimientos_inventario mi 
ON mi.id_orden_produccion = op.id_orden_produccion

JOIN materias_primas mp 
ON mi.id_materia = mp.id_materia

JOIN lotes l 
ON mi.id_lote = l.id_lote

WHERE mi.tipo_movimiento = 'Salida'
AND op.id_orden_produccion = 1;

-- CONSULTAR MOVIMIENTOS CON DETALLE
SELECT 
    mi.id_movimiento,
    mi.tipo_movimiento,
    mi.cantidad,
    mi.fecha,
    mi.observacion,

    -- Usuario
    u.nombre AS usuario,

    -- Materia prima
    mp.nombre AS materia_prima,
    mp.codigo,

    -- Lote
    l.codigo_lote,
    l.stock_restante,

    -- Pedido (si aplica)
    p.id_pedido,
    pr.nombre_proveedor,

    -- Orden de producción (si aplica)
    op.id_orden_produccion,
    r.nombre_producto

FROM movimientos_inventario mi

JOIN usuarios u 
    ON mi.id_usuario = u.id_usuario

JOIN materias_primas mp 
    ON mi.id_materia = mp.id_materia

LEFT JOIN lotes l 
    ON mi.id_lote = l.id_lote

LEFT JOIN pedidos p 
    ON mi.id_pedido = p.id_pedido

LEFT JOIN proveedores pr 
    ON p.id_proveedor = pr.id_proveedor

LEFT JOIN ordenes_produccion op 
    ON mi.id_orden_produccion = op.id_orden_produccion

LEFT JOIN recetas r 
    ON op.id_receta = r.id_receta

WHERE mi.id_movimiento = 3; -- aquí cambias el ID


SELECT 
    u.nombre AS usuario,
    r.nombre_rol,
    p.nombre_proceso
FROM usuarios u
JOIN roles r ON u.id_rol = r.id_rol
LEFT JOIN usuario_procesos up ON u.id_usuario = up.id_usuario
LEFT JOIN procesos p ON up.id_proceso = p.id_proceso;


SELECT * FROM usuarios;


 SELECT 
        mp.id_materia AS id,
        mp.nombre,
        mp.stock_min AS stockMinimo,
        ROUND(COALESCE(SUM(l.stock_restante), 0),2) AS stockActual,
        'kg' AS unidad
      FROM materias_primas mp
      LEFT JOIN lotes l 
        ON mp.id_materia = l.id_materia 
        AND l.estado = 'activo'
      GROUP BY mp.id_materia, mp.nombre, mp.stock_min;

SELECT * FROM detalle_receta;

UPDATE usuarios SET contraseña = "$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u" WHERE id_usuario = 8;

select * from proveedores where email = "ventas@quimicos.com";

select * from ordenes_produccion;