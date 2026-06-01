-- ==================================================================
-- BASE DE DATOS COMPLETA: casercon
-- Incluye estructura original + 127 materias primas
-- ==================================================================

CREATE DATABASE IF NOT EXISTS casercon
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE casercon;

-- ==================================================================
--         TABLAS: Usuarios y permisos
-- ==================================================================

CREATE TABLE roles(
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE usuarios(
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_rol INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    email VARCHAR(250) UNIQUE NOT NULL,
    contraseña VARCHAR(225) NOT NULL,
    codigo_recuperacion VARCHAR(6),
    codigo_expiry DATETIME NULL,
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo',
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE procesos (
    id_proceso INT PRIMARY KEY AUTO_INCREMENT,
    nombre_proceso VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE usuario_procesos (
    id_usuario_proceso INT PRIMARY KEY AUTO_INCREMENT,
    id_proceso INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    UNIQUE(id_usuario, id_proceso)
);

-- ==================================================================
--    TABLAS: Proveedores, pedidos, categorias, materias primas, lotes
-- ==================================================================

CREATE TABLE proveedores (
    id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre_proveedor VARCHAR(80) NOT NULL,
    nombre_empresa VARCHAR(80),
    email VARCHAR(250),
    telefono VARCHAR(10),
    direccion VARCHAR(80),
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo',
    observaciones TEXT NULL
);

CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT NOT NULL,
    no_orden_compra VARCHAR(80),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_pedido ENUM('compra','devolucion') NOT NULL,
    fecha_entrega DATETIME,
    observaciones TEXT,
    estado ENUM('pendiente','recibido','cancelado') DEFAULT 'pendiente',
    id_usuario_creador INT NOT NULL,
    id_usuario_receptor INT,
    id_pedido_origen INT,
    FOREIGN KEY (id_pedido_origen) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_usuario_receptor) REFERENCES usuarios(id_usuario)
);

CREATE TABLE categoria_materias(
    id_categoria_materia INT PRIMARY KEY AUTO_INCREMENT,
    nombre_categoria_materia VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE materias_primas(
    id_materia INT PRIMARY KEY AUTO_INCREMENT,
    abreviacion VARCHAR(3) NOT NULL UNIQUE,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    id_categoria_materia INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    observacion_inhabilitacion TEXT NULL DEFAULT NULL,
    stock_min DECIMAL(12,2) DEFAULT 0,
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo',
    FOREIGN KEY (id_categoria_materia) REFERENCES categoria_materias(id_categoria_materia)
);

CREATE TABLE detalle_pedidos (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_materia INT NOT NULL,
    cantidad_solicitada DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia)
);

CREATE TABLE lotes (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    numero_lote INT NOT NULL,
    id_detalle_pedido INT NULL,
    codigo_lote VARCHAR(50) UNIQUE NOT NULL,
    stock_inicial DECIMAL(12,2) NOT NULL,
    stock_restante DECIMAL(12,2) NOT NULL,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'agotado', 'en_devolucion') DEFAULT 'activo',
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedidos(id_detalle_pedido),
    UNIQUE(id_materia, numero_lote)
);
-- ==================================================================
--         TABLAS: Recetas y ordenes de produccion
-- ==================================================================

CREATE TABLE recetas (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(80) NOT NULL,
    estado ENUM('Activo','Inhabilitado') DEFAULT 'Activo' NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_receta (
    id_detalle_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_receta INT NOT NULL,
    id_materia INT NOT NULL,
    cantidad_porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_receta) REFERENCES recetas(id_receta),
    FOREIGN KEY (id_materia) REFERENCES materias_primas(id_materia),
    UNIQUE(id_receta, id_materia)
);

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
--         TABLA: Movimientos de inventario + Trigger
-- ==================================================================

CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    id_lote INT,
    id_usuario INT NOT NULL,
    tipo_movimiento ENUM('Entrada','Salida','Devolucion') NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
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

-- ==================================================================
--         INSERT: Usuarios y permisos
-- ==================================================================

INSERT INTO roles (nombre_rol) VALUES
('Administrador'),
('Operario');

INSERT INTO usuarios (id_rol, nombre, email, contraseña, estado) VALUES
(1,'Carlos Ramirez','admin@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u','Activo'),
(2,'Ana Lopez','operario@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u','Activo'),
(2,'Esteban Suarez','operario2@casercon.com','$2b$10$ljbvSm496P52FAJTsRXy8u8a/JSjb2m/n9VFZ41quG.L/GL9Pff6u','Activo');

INSERT INTO procesos (nombre_proceso) VALUES
('Recepcion'),
('Produccion');

INSERT INTO usuario_procesos (id_proceso, id_usuario) VALUES
(1,2),
(2,2),
(1,3);

-- ==================================================================
--         INSERT: Proveedores
-- ==================================================================

INSERT INTO proveedores (nombre_proveedor, nombre_empresa, email, telefono, direccion, estado, observaciones) VALUES
('Juan Perez','Quimicos SAS','ventas@quimicos.com','3001234567','Bogota','Activo',NULL),
('Maria Torres','Pigmentos SA','contacto@pigmentos.com','3009876543','Medellin','Activo','vive lejos');

-- ==================================================================
--         INSERT: Categorias de materias primas
-- ==================================================================

INSERT INTO categoria_materias (nombre_categoria_materia) VALUES
('Resinas'),
('Pigmentos'),
('Solventes'),
('ADITIVO ESMALTE'),
('ADITIVO VINILICO'),
('ADITIVOS MASILLAS ACRÍLICAS'),
('ADITIVOS MASILLAS EN POLVO'),
('ADITIVOS PINTURA INDUSTRIAL'),
('ADVANTEX'),
('CARGA EXTENDER Y FUNCIONAL'),
('CARGAS INERTES'),
('METEOLAT 780'),
('PASTA ALQUIDICA'),
('PASTA BASE AGUA'),
('PASTA UREA ALDEIDICA UNIVERSAL'),
('SIN CATEGORIA'),
('YESO');

-- ==================================================================
--   INSERT: 127 materias primas
-- ==================================================================

INSERT INTO materias_primas (abreviacion, codigo, id_categoria_materia, nombre, stock_min) VALUES
  ('AC5','61902511179',1,'ACRONAL 50%',60.0),
  ('AL1','61905211183',1,'ALQUIDAN 136',69.0),
  ('AS5','61905611179',1,'AQUAPOLYMER SA 5025',18.0),
  ('AV5','61905711182',1,'AQUAPOLYMER VA 5500',49.0),
  ('AQV','61905811182',1,'AQUAPOLYMER VA 5511',77.0),
  ('CHA','61906411180',1,'CHEMOCRYL AC20',144.0),
  ('CHS','61906511180',1,'CHEMOCRYL SA-16',136.0),
  ('CHE','61906611181',1,'CHEMOCRYL SA-18',93.0),
  ('E3X','61907611184',1,'EPICURE 3274 X 100',72.0),
  ('EP8','61907711185',1,'EPON 828',145.0),
  ('T5A','61913111179',1,'TEXILAN 554 A E5',127.0),
  ('THI','62003611000',3,'THINNER',34.0),
  ('VAR','62003711214',3,'VARSOL',107.0),
  ('XIL','62003811000',3,'XILOL',94.0),
  ('BUT','62006111000',3,'BUTILGLICOL',6.0),
  ('DAS','62007111000',3,'DAWANOL SURTISOL',131.0),
  ('MEC','62209111174',4,'METIL ETIL CETOXIMA',93.0),
  ('PAB','62210411170',4,'PANGEL B20',126.0),
  ('CH7','62210811197',4,'CHEMOSPERSE 77',157.0),
  ('PA7','62210911222',4,'PATCOM 72',193.0),
  ('PA1','62211011174',4,'PATOX 1',133.0),
  ('AG5','62305111173',5,'AGITAN 5091',57.0),
  ('GEM','62307911210',5,'GENAMIN MTT',97.0),
  ('HB1','62308111201',5,'HECELLOSE B 100K',58.0),
  ('HB5','62308211201',5,'HECELLOSE B 50K',171.0),
  ('HI3','62308511200',5,'HISOL 307',171.0),
  ('MP0','62309011198',5,'MERQSPERSE PA 045',22.0),
  ('NBM','62309311186',5,'NIPACIDE BKX M',115.0),
  ('NC5','62309411186',5,'NIPACIDE CFX 5',176.0),
  ('NCP','62309511168',5,'NIPACIDE CO25 PLUS',115.0),
  ('PAD','62310711204',5,'PAT ADD DA 202',107.0),
  ('PTT','62312311219',5,'PROPILENGLICOL TECNICO TI',29.0),
  ('TP4','62312911202',5,'TAFIGEL PUR 45',76.0),
  ('WS9','62313711172',5,'WS 974',15.0),
  ('RUC','62315011241',5,'RUANTA C12',179.0),
  ('HI4','62315511197',5,'HIDIS 40',110.0),
  ('HF8','62408311207',6,'HECELLOSE FMC 8821',86.0),
  ('MF8','62408911207',6,'MECELLOSE FMC 8821',130.0),
  ('PAS','62410511206',6,'PANGEL S9',160.0),
  ('CEB','62506311042',7,'CEMENTO BLANCO',120.0),
  ('CEG','62506311043',7,'CEMENTO GRIS',143.0),
  ('MF7','62508811207',7,'MECELLOSE FMC 72507',93.0),
  ('RER','62512511218',7,'REDIPOL RDP04',22.0),
  ('SUL','62512811208',7,'SUPBENT LT',167.0),
  ('AD5','62605011211',8,'ADITIVO 57',144.0),
  ('SA1','62612611216',8,'SANTICIZER 160',132.0),
  ('SA5','62612711169',8,'SHIELDEX AC - 5',190.0),
  ('WH2','62613611171',8,'WACKER HDK 20',21.0),
  ('ANC','62705411193',10,'ANTEC C-98',47.0),
  ('ANT','62705511193',10,'ANTEC C-OP',186.0),
  ('BCE','62706011178',10,'BARYTEX CIMBAR EX',182.0),
  ('CE4','62706211205',10,'CELITE 499',36.0),
  ('CDZ','62706711217',10,'CROMATO DE ZINC',111.0),
  ('CAC','62806811213',11,'CUARZO ARROCILLO CLASIFICADO 4B',44.0),
  ('CAH','62806911212',11,'CUARZO ARROCILLO HUILA Nº1',83.0),
  ('CAM','62807011214',11,'CUARZO ARROCILLO MINE',50.0),
  ('MM2','62808711187',11,'MARMOLINA MALLA 20 BLANCA',131.0),
  ('MAM','62808711188',11,'MARMOLINA MALLA 20 BLANCA',198.0),
  ('MAR','62808711189',11,'MARMOLINA MALLA 20 NEUTRA',77.0),
  ('MOE','62809211194',11,'MICRAL OPAC EXTRA',177.0),
  ('PR7','62812211196',11,'PRODEKAR 4',125.0),
  ('TAQ','62812411195',11,'TALCO QE3',134.0),
  ('TAC','62813011195',11,'TALCO CM3',25.0),
  ('MI2','62814011000',11,'MICROCARB 20',109.0),
  ('TAL','62814411195',11,'TALCO QU3',120.0),
  ('DFV','62907211225',13,'DISPAL FTALO VF-7',6.0),
  ('DIN','62907311209',13,'DISPAL NH-7',5.0),
  ('DRC','62907411221',13,'DISPAL ROJO CARMIN RC:57-1',35.0),
  ('DIR','62907511220',13,'DISPAL ROJO CARMIN',38.0),
  ('DAF','62907811177',13,'DISPAL AZUL FTALO AF 15-2',48.0),
  ('GOT','62908011203',13,'GOLD TONNER',104.0),
  ('PTA','62910611209',13,'PASTA TRICOTINT A 9070',108.0),
  ('TA9','62913311175',13,'TRICOTINT A 9032',93.0),
  ('TRA','62913411225',13,'TRICOTINT A 9050',131.0),
  ('TRI','62913412251',13,'TRICOTINT A 9027',14.0),
  ('PT6','63011411167',14,'PREDISPERSO TRICONYL 6018',20.0),
  ('PRT','63011511199',14,'PREDISPERSO TRICONYL 6232',73.0),
  ('PRE','63011611229',14,'PREDISPERSO TRICONYL 6235',69.0),
  ('PR1','63011711175',14,'PREDISPERSO TRICONYL 6367',36.0),
  ('PR2','63011811176',14,'PREDISPERSO TRICONYL 6377',14.0),
  ('PR3','63011911227',14,'PREDISPERSO TRICONYL 6411',18.0),
  ('PR4','63012011225',14,'PREDISPERSO TRICONYL 6474',57.0),
  ('PR5','63012111209',14,'PREDISPERSO TRICONYL 6718',112.0),
  ('PND','63014211209',14,'PREDISPERSO NEGRO DISPAQ B7',17.0),
  ('PRD','63015611199',14,'PREDISPERSO ROJO DISPAQ R-112',62.0),
  ('LS4','63108611023',15,'LEAFING STAPA 4 L',121.0),
  ('TRU','63113511175',15,'TRICOTINT U9034',169.0),
  ('ACV','63205311167',2,'AMARILLO CROMO VERDOSO (SB310)',170.0),
  ('AMA','63205911175',2,'AZUL MILORI AF-90',159.0),
  ('ODC','63209611166',2,'OXIDO DE CROMO SB 310 ROJIZO',196.0),
  ('ODH','63209711224',2,'OXIDO DE HIERRO 4711 NUBIFER',137.0),
  ('OXD','63209811191',2,'OXIDO DE HIERRO 4781 NUBIOLA 663',84.0),
  ('OXI','63209911002',2,'OXIDO DE HIERRO AMARILLO SY 313',73.0),
  ('OX1','63210011012',2,'OXIDO DE HIERRO D330',43.0),
  ('OX2','63210111014',2,'OXIDO DE HIERRO SY130S',111.0),
  ('OX4','63210211192',2,'OXIDO DE HIERRO SY663',62.0),
  ('OX5','63210311012',2,'OXIDO DE HIERRO SYD330',10.0),
  ('PNM','63211111100',2,'PIGMENTO NARANJA MOLIBDENO',42.0),
  ('POR','63211211215',2,'PIGMENTO ORO RICO',38.0),
  ('PIG','63211311226',2,'PIGMNETO G105',70.0),
  ('TDN','63213211190',2,'TITANIUM DIOXIDE NR-9503',13.0),
  ('DDT','63214111235',2,'DIÓXIDO DE TITANIO BLR 698 (699)',188.0),
  ('HES','63308411223',17,'HEMIHIDRATO SUCROYESO',101.0),
  ('M4S','62341311207',5,'MK 40 - SL',152.0),
  ('ARB','61916311179',1,'ARACRYL RE-2 BASE AGUA',124.0),
  ('PVD','63017111225',14,'PREDISPERSO VERDE DISPAQ G-7',49.0),
  ('PRA','63017011175',14,'PREDISPERSO AZUL DISPAQ B 15:0',156.0),
  ('SAC','66666666',16,'SUDADUR AMARILLO CROMO MEDIO 1322K',81.0),
  ('ME7','6662225555',12,'METEOLAT 780',42.0),
  ('ADV','6565656656',9,'ADVANTEX',117.0),
  ('TR2','6532582',4,'TRIMETÁLICO 233',157.0),
  ('DID','63213211529',2,'DIÓXIDO DE TITANIO R-6618',62.0),
  ('NF1','652458',8,'NUBIROX FR 10',45.0),
  ('FDC','65458521466',16,'FIBRAS DE CELULOSA',114.0),
  ('AQS','61934611180',1,'AQUAPOLYMER SAE 5004 BASE AGUA',99.0),
  ('ACE','61934611181',5,'ACTICIDE EPW',21.0),
  ('TEX','62315011242',5,'TEXANOL',29.0),
  ('DIB','62939011217',13,'DISPAL BA',193.0),
  ('RES','61907711186',1,'RESINA R-332',123.0),
  ('SV7','6666555222',2,'SUDAFAST VERDE 7',112.0),
  ('LE9','63239411551',2,'LAC E 900 - ORO PÁLIDO',67.0),
  ('CH5','61905211184',1,'CHEMOMEDSOY 50',66.0),
  ('HIP','62040711000',3,'HIPOCLORITO',11.0),
  ('CIN','62040611000',3,'ÁCIDO NÍTRICO',52.0),
  ('AMC','658374',16,'AMC',42.0),
  ('DF1','623137111721',5,'DEE FO 1015',134.0),
  ('SY9','655482100',1,'SYNTHACRIL 9000',37.0);

-- ==================================================================
--   INSERT: Lotes con stock_inicial = stock_restante correctos
--
--   ESTADO POR GRUPO:
--   ─ 7 CRÍTICOS  : stock_inicial = stock_min
--                   (stockActual <= stock_min → Crítico)
--   ─ 22 BAJOS    : stock_inicial = ROUND(stock_min * 1.5)
--                   (stock_min < stockActual <= stock_min*2 → Bajo)
--   ─ 98 SUFICIENTES: stock_inicial = ROUND(stock_min * 3)
--                   (stockActual > stock_min*2 → Suficiente)
-- ==================================================================

INSERT INTO lotes (id_materia, id_detalle_pedido, numero_lote, codigo_lote, stock_inicial, stock_restante, fecha_ingreso) VALUES

-- ══════════════════════════════════════════════════════════════════
-- 7 CRÍTICOS: stock_inicial = stock_min
-- ══════════════════════════════════════════════════════════════════

-- CIN  ÁCIDO NÍTRICO            stock_min=52  → stock=52
((SELECT id_materia FROM materias_primas WHERE codigo='62040611000' LIMIT 1),NULL,1,'CIN-001-04052026',52.0,52.0,'2026-05-04 00:00:00'),

-- BUT  BUTILGLICOL              stock_min=6   → stock=6
((SELECT id_materia FROM materias_primas WHERE codigo='62006111000' LIMIT 1),NULL,1,'BUT-001-04052026',6.0,6.0,'2026-05-04 00:00:00'),

-- WS9  WS 974                   stock_min=15  → stock=15
((SELECT id_materia FROM materias_primas WHERE codigo='62313711172' LIMIT 1),NULL,1,'WS9-001-04052026',15.0,15.0,'2026-05-04 00:00:00'),

-- TRI  TRICOTINT A 9027         stock_min=14  → stock=14
((SELECT id_materia FROM materias_primas WHERE codigo='62913412251' LIMIT 1),NULL,1,'TRI-001-04052026',14.0,14.0,'2026-05-04 00:00:00'),

-- PR2  PREDISPERSO TRICONYL 6377 stock_min=14 → stock=14
((SELECT id_materia FROM materias_primas WHERE codigo='63011811176' LIMIT 1),NULL,1,'PR11-001-04052026',14.0,14.0,'2026-05-04 00:00:00'),

-- TDN  TITANIUM DIOXIDE NR-9503 stock_min=13  → stock=13
((SELECT id_materia FROM materias_primas WHERE codigo='63213211190' LIMIT 1),NULL,1,'TDN-001-04052026',13.0,13.0,'2026-05-04 00:00:00'),

-- HIP  HIPOCLORITO              stock_min=11  → stock=11
((SELECT id_materia FROM materias_primas WHERE codigo='62040711000' LIMIT 1),NULL,1,'HIP-001-04052026',11.0,11.0,'2026-05-04 00:00:00'),

-- ══════════════════════════════════════════════════════════════════
-- 22 BAJOS: stock_inicial = ROUND(stock_min * 1.5)
-- ══════════════════════════════════════════════════════════════════

-- AC5  ACRONAL 50%              stock_min=60  → 60*1.5=90
((SELECT id_materia FROM materias_primas WHERE codigo='61902511179' LIMIT 1),NULL,1,'AC5-001-04052026',90.0,90.0,'2026-05-04 00:00:00'),

-- AL1  ALQUIDAN 136             stock_min=69  → 69*1.5=104
((SELECT id_materia FROM materias_primas WHERE codigo='61905211183' LIMIT 1),NULL,1,'AL1-001-04052026',104.0,104.0,'2026-05-04 00:00:00'),

-- AS5  AQUAPOLYMER SA 5025      stock_min=18  → 18*1.5=27
((SELECT id_materia FROM materias_primas WHERE codigo='61905611179' LIMIT 1),NULL,1,'AS5-001-04052026',27.0,27.0,'2026-05-04 00:00:00'),

-- AV5  AQUAPOLYMER VA 5500      stock_min=49  → 49*1.5=74
((SELECT id_materia FROM materias_primas WHERE codigo='61905711182' LIMIT 1),NULL,1,'AV5-001-04052026',74.0,74.0,'2026-05-04 00:00:00'),

-- AQV  AQUAPOLYMER VA 5511      stock_min=77  → 77*1.5=116
((SELECT id_materia FROM materias_primas WHERE codigo='61905811182' LIMIT 1),NULL,1,'AQV-001-04052026',116.0,116.0,'2026-05-04 00:00:00'),

-- CHA  CHEMOCRYL AC20           stock_min=144 → 144*1.5=216
((SELECT id_materia FROM materias_primas WHERE codigo='61906411180' LIMIT 1),NULL,1,'CHA-001-04052026',216.0,216.0,'2026-05-04 00:00:00'),

-- CHS  CHEMOCRYL SA-16          stock_min=136 → 136*1.5=204
((SELECT id_materia FROM materias_primas WHERE codigo='61906511180' LIMIT 1),NULL,1,'CHS-001-04052026',204.0,204.0,'2026-05-04 00:00:00'),

-- CHE  CHEMOCRYL SA-18          stock_min=93  → 93*1.5=140
((SELECT id_materia FROM materias_primas WHERE codigo='61906611181' LIMIT 1),NULL,1,'CHE-001-04052026',140.0,140.0,'2026-05-04 00:00:00'),

-- E3X  EPICURE 3274 X 100       stock_min=72  → 72*1.5=108
((SELECT id_materia FROM materias_primas WHERE codigo='61907611184' LIMIT 1),NULL,1,'E3X-001-04052026',108.0,108.0,'2026-05-04 00:00:00'),

-- EP8  EPON 828                 stock_min=145 → 145*1.5=218
((SELECT id_materia FROM materias_primas WHERE codigo='61907711185' LIMIT 1),NULL,1,'EP8-001-04052026',218.0,218.0,'2026-05-04 00:00:00'),

-- T5A  TEXILAN 554 A E5         stock_min=127 → 127*1.5=191
((SELECT id_materia FROM materias_primas WHERE codigo='61913111179' LIMIT 1),NULL,1,'T5A-001-04052026',191.0,191.0,'2026-05-04 00:00:00'),

-- THI  THINNER                  stock_min=34  → 34*1.5=51
((SELECT id_materia FROM materias_primas WHERE codigo='62003611000' LIMIT 1),NULL,1,'THI-001-04052026',51.0,51.0,'2026-05-04 00:00:00'),

-- VAR  VARSOL                   stock_min=107 → 107*1.5=161
((SELECT id_materia FROM materias_primas WHERE codigo='62003711214' LIMIT 1),NULL,1,'VAR-001-04052026',161.0,161.0,'2026-05-04 00:00:00'),

-- XIL  XILOL                    stock_min=94  → 94*1.5=141
((SELECT id_materia FROM materias_primas WHERE codigo='62003811000' LIMIT 1),NULL,1,'XIL-001-04052026',141.0,141.0,'2026-05-04 00:00:00'),

-- DAS  DAWANOL SURTISOL         stock_min=131 → 131*1.5=197
((SELECT id_materia FROM materias_primas WHERE codigo='62007111000' LIMIT 1),NULL,1,'DAS-001-04052026',197.0,197.0,'2026-05-04 00:00:00'),

-- MEC  METIL ETIL CETOXIMA      stock_min=93  → 93*1.5=140
((SELECT id_materia FROM materias_primas WHERE codigo='62209111174' LIMIT 1),NULL,1,'MEC-001-04052026',140.0,140.0,'2026-05-04 00:00:00'),

-- PAB  PANGEL B20               stock_min=126 → 126*1.5=189
((SELECT id_materia FROM materias_primas WHERE codigo='62210411170' LIMIT 1),NULL,1,'PAB-001-04052026',189.0,189.0,'2026-05-04 00:00:00'),

-- CH7  CHEMOSPERSE 77           stock_min=157 → 157*1.5=236
((SELECT id_materia FROM materias_primas WHERE codigo='62210811197' LIMIT 1),NULL,1,'CH7-001-04052026',236.0,236.0,'2026-05-04 00:00:00'),

-- PA7  PATCOM 72                stock_min=193 → 193*1.5=290
((SELECT id_materia FROM materias_primas WHERE codigo='62210911222' LIMIT 1),NULL,1,'PA7-001-04052026',290.0,290.0,'2026-05-04 00:00:00'),

-- PA1  PATOX 1                  stock_min=133 → 133*1.5=200
((SELECT id_materia FROM materias_primas WHERE codigo='62211011174' LIMIT 1),NULL,1,'PA1-001-04052026',200.0,200.0,'2026-05-04 00:00:00'),

-- AG5  AGITAN 5091              stock_min=57  → 57*1.5=86
((SELECT id_materia FROM materias_primas WHERE codigo='62305111173' LIMIT 1),NULL,1,'AG5-001-04052026',86.0,86.0,'2026-05-04 00:00:00'),

-- GEM  GENAMIN MTT              stock_min=97  → 97*1.5=146
((SELECT id_materia FROM materias_primas WHERE codigo='62307911210' LIMIT 1),NULL,1,'GEM-001-04052026',146.0,146.0,'2026-05-04 00:00:00'),

-- ══════════════════════════════════════════════════════════════════
-- 98 SUFICIENTES: stock_inicial = ROUND(stock_min * 3)
-- ══════════════════════════════════════════════════════════════════

-- HB1  HECELLOSE B 100K         stock_min=58  → 58*3=174
((SELECT id_materia FROM materias_primas WHERE codigo='62308111201' LIMIT 1),NULL,1,'HB1-001-04052026',174.0,174.0,'2026-05-04 00:00:00'),

-- HB5  HECELLOSE B 50K          stock_min=171 → 171*3=513
((SELECT id_materia FROM materias_primas WHERE codigo='62308211201' LIMIT 1),NULL,1,'HB5-001-04052026',513.0,513.0,'2026-05-04 00:00:00'),

-- HI3  HISOL 307                stock_min=171 → 171*3=513
((SELECT id_materia FROM materias_primas WHERE codigo='62308511200' LIMIT 1),NULL,1,'HI3-001-04052026',513.0,513.0,'2026-05-04 00:00:00'),

-- MP0  MERQSPERSE PA 045        stock_min=22  → 22*3=66
((SELECT id_materia FROM materias_primas WHERE codigo='62309011198' LIMIT 1),NULL,1,'MP0-001-04052026',66.0,66.0,'2026-05-04 00:00:00'),

-- NBM  NIPACIDE BKX M           stock_min=115 → 115*3=345
((SELECT id_materia FROM materias_primas WHERE codigo='62309311186' LIMIT 1),NULL,1,'NBM-001-04052026',345.0,345.0,'2026-05-04 00:00:00'),

-- NC5  NIPACIDE CFX 5           stock_min=176 → 176*3=528
((SELECT id_materia FROM materias_primas WHERE codigo='62309411186' LIMIT 1),NULL,1,'NC5-001-04052026',528.0,528.0,'2026-05-04 00:00:00'),

-- NCP  NIPACIDE CO25 PLUS       stock_min=115 → 115*3=345
((SELECT id_materia FROM materias_primas WHERE codigo='62309511168' LIMIT 1),NULL,1,'NCP-001-04052026',345.0,345.0,'2026-05-04 00:00:00'),

-- PAD  PAT ADD DA 202           stock_min=107 → 107*3=321
((SELECT id_materia FROM materias_primas WHERE codigo='62310711204' LIMIT 1),NULL,1,'PAD-001-04052026',321.0,321.0,'2026-05-04 00:00:00'),

-- PTT  PROPILENGLICOL TECNICO   stock_min=29  → 29*3=87
((SELECT id_materia FROM materias_primas WHERE codigo='62312311219' LIMIT 1),NULL,1,'PTT-001-04052026',87.0,87.0,'2026-05-04 00:00:00'),

-- TP4  TAFIGEL PUR 45           stock_min=76  → 76*3=228
((SELECT id_materia FROM materias_primas WHERE codigo='62312911202' LIMIT 1),NULL,1,'TP4-001-04052026',228.0,228.0,'2026-05-04 00:00:00'),

-- RUC  RUANTA C12               stock_min=179 → 179*3=537
((SELECT id_materia FROM materias_primas WHERE codigo='62315011241' LIMIT 1),NULL,1,'RUC-001-04052026',537.0,537.0,'2026-05-04 00:00:00'),

-- HI4  HIDIS 40                 stock_min=110 → 110*3=330
((SELECT id_materia FROM materias_primas WHERE codigo='62315511197' LIMIT 1),NULL,1,'HI4-001-04052026',330.0,330.0,'2026-05-04 00:00:00'),

-- HF8  HECELLOSE FMC 8821       stock_min=86  → 86*3=258
((SELECT id_materia FROM materias_primas WHERE codigo='62408311207' LIMIT 1),NULL,1,'HF8-001-04052026',258.0,258.0,'2026-05-04 00:00:00'),

-- MF8  MECELLOSE FMC 8821       stock_min=130 → 130*3=390
((SELECT id_materia FROM materias_primas WHERE codigo='62408911207' LIMIT 1),NULL,1,'MF8-001-04052026',390.0,390.0,'2026-05-04 00:00:00'),

-- PAS  PANGEL S9                stock_min=160 → 160*3=480
((SELECT id_materia FROM materias_primas WHERE codigo='62410511206' LIMIT 1),NULL,1,'PAS-001-04052026',480.0,480.0,'2026-05-04 00:00:00'),

-- CEB  CEMENTO BLANCO           stock_min=120 → 120*3=360
((SELECT id_materia FROM materias_primas WHERE codigo='62506311042' LIMIT 1),NULL,1,'CEB-001-04052026',360.0,360.0,'2026-05-04 00:00:00'),

-- CEG  CEMENTO GRIS             stock_min=143 → 143*3=429
((SELECT id_materia FROM materias_primas WHERE codigo='62506311043' LIMIT 1),NULL,1,'CEG-001-04052026',429.0,429.0,'2026-05-04 00:00:00'),

-- MF7  MECELLOSE FMC 72507      stock_min=93  → 93*3=279
((SELECT id_materia FROM materias_primas WHERE codigo='62508811207' LIMIT 1),NULL,1,'MF7-001-04052026',279.0,279.0,'2026-05-04 00:00:00'),

-- RER  REDIPOL RDP04            stock_min=22  → 22*3=66
((SELECT id_materia FROM materias_primas WHERE codigo='62512511218' LIMIT 1),NULL,1,'RER-001-04052026',66.0,66.0,'2026-05-04 00:00:00'),

-- SUL  SUPBENT LT               stock_min=167 → 167*3=501
((SELECT id_materia FROM materias_primas WHERE codigo='62512811208' LIMIT 1),NULL,1,'SUL-001-04052026',501.0,501.0,'2026-05-04 00:00:00'),

-- AD5  ADITIVO 57               stock_min=144 → 144*3=432
((SELECT id_materia FROM materias_primas WHERE codigo='62605011211' LIMIT 1),NULL,1,'AD5-001-04052026',432.0,432.0,'2026-05-04 00:00:00'),

-- SA1  SANTICIZER 160           stock_min=132 → 132*3=396
((SELECT id_materia FROM materias_primas WHERE codigo='62612611216' LIMIT 1),NULL,1,'SA1-001-04052026',396.0,396.0,'2026-05-04 00:00:00'),

-- SA5  SHIELDEX AC-5            stock_min=190 → 190*3=570
((SELECT id_materia FROM materias_primas WHERE codigo='62612711169' LIMIT 1),NULL,1,'SA5-001-04052026',570.0,570.0,'2026-05-04 00:00:00'),

-- WH2  WACKER HDK 20            stock_min=21  → 21*3=63
((SELECT id_materia FROM materias_primas WHERE codigo='62613611171' LIMIT 1),NULL,1,'WH2-001-04052026',63.0,63.0,'2026-05-04 00:00:00'),

-- ANC  ANTEC C-98               stock_min=47  → 47*3=141
((SELECT id_materia FROM materias_primas WHERE codigo='62705411193' LIMIT 1),NULL,1,'ANC-001-04052026',141.0,141.0,'2026-05-04 00:00:00'),

-- ANT  ANTEC C-OP               stock_min=186 → 186*3=558
((SELECT id_materia FROM materias_primas WHERE codigo='62705511193' LIMIT 1),NULL,1,'ANT-001-04052026',558.0,558.0,'2026-05-04 00:00:00'),

-- BCE  BARYTEX CIMBAR EX        stock_min=182 → 182*3=546
((SELECT id_materia FROM materias_primas WHERE codigo='62706011178' LIMIT 1),NULL,1,'BCE-001-04052026',546.0,546.0,'2026-05-04 00:00:00'),

-- CE4  CELITE 499               stock_min=36  → 36*3=108
((SELECT id_materia FROM materias_primas WHERE codigo='62706211205' LIMIT 1),NULL,1,'CE4-001-04052026',108.0,108.0,'2026-05-04 00:00:00'),

-- CDZ  CROMATO DE ZINC          stock_min=111 → 111*3=333
((SELECT id_materia FROM materias_primas WHERE codigo='62706711217' LIMIT 1),NULL,1,'CDZ-001-04052026',333.0,333.0,'2026-05-04 00:00:00'),

-- CAC  CUARZO ARROCILLO 4B      stock_min=44  → 44*3=132
((SELECT id_materia FROM materias_primas WHERE codigo='62806811213' LIMIT 1),NULL,1,'CAC-001-04052026',132.0,132.0,'2026-05-04 00:00:00'),

-- CAH  CUARZO ARROCILLO HUILA   stock_min=83  → 83*3=249
((SELECT id_materia FROM materias_primas WHERE codigo='62806911212' LIMIT 1),NULL,1,'CAH-001-04052026',249.0,249.0,'2026-05-04 00:00:00'),

-- CAM  CUARZO ARROCILLO MINE    stock_min=50  → 50*3=150
((SELECT id_materia FROM materias_primas WHERE codigo='62807011214' LIMIT 1),NULL,1,'CAM-001-04052026',150.0,150.0,'2026-05-04 00:00:00'),

-- MM2  MARMOLINA MALLA 20 BL    stock_min=131 → 131*3=393
((SELECT id_materia FROM materias_primas WHERE codigo='62808711187' LIMIT 1),NULL,1,'MM2-001-04052026',393.0,393.0,'2026-05-04 00:00:00'),

-- MAM  MARMOLINA MALLA 20 BL2   stock_min=198 → 198*3=594
((SELECT id_materia FROM materias_primas WHERE codigo='62808711188' LIMIT 1),NULL,1,'MAM-001-04052026',594.0,594.0,'2026-05-04 00:00:00'),

-- MAR  MARMOLINA MALLA 20 NEU   stock_min=77  → 77*3=231
((SELECT id_materia FROM materias_primas WHERE codigo='62808711189' LIMIT 1),NULL,1,'MAR-001-04052026',231.0,231.0,'2026-05-04 00:00:00'),

-- MOE  MICRAL OPAC EXTRA        stock_min=177 → 177*3=531
((SELECT id_materia FROM materias_primas WHERE codigo='62809211194' LIMIT 1),NULL,1,'MOE-001-04052026',531.0,531.0,'2026-05-04 00:00:00'),

-- PR7  PRODEKAR 4               stock_min=125 → 125*3=375
((SELECT id_materia FROM materias_primas WHERE codigo='62812211196' LIMIT 1),NULL,1,'PR7-001-04052026',375.0,375.0,'2026-05-04 00:00:00'),

-- TAQ  TALCO QE3                stock_min=134 → 134*3=402
((SELECT id_materia FROM materias_primas WHERE codigo='62812411195' LIMIT 1),NULL,1,'TAQ-001-04052026',402.0,402.0,'2026-05-04 00:00:00'),

-- TAC  TALCO CM3                stock_min=25  → 25*3=75
((SELECT id_materia FROM materias_primas WHERE codigo='62813011195' LIMIT 1),NULL,1,'TAC-001-04052026',75.0,75.0,'2026-05-04 00:00:00'),

-- MI2  MICROCARB 20             stock_min=109 → 109*3=327
((SELECT id_materia FROM materias_primas WHERE codigo='62814011000' LIMIT 1),NULL,1,'MI2-001-04052026',327.0,327.0,'2026-05-04 00:00:00'),

-- TAL  TALCO QU3                stock_min=120 → 120*3=360
((SELECT id_materia FROM materias_primas WHERE codigo='62814411195' LIMIT 1),NULL,1,'TAL-001-04052026',360.0,360.0,'2026-05-04 00:00:00'),

-- DFV  DISPAL FTALO VF-7        stock_min=6   → 6*3=18
((SELECT id_materia FROM materias_primas WHERE codigo='62907211225' LIMIT 1),NULL,1,'DFV-001-04052026',18.0,18.0,'2026-05-04 00:00:00'),

-- DIN  DISPAL NH-7              stock_min=5   → 5*3=15
((SELECT id_materia FROM materias_primas WHERE codigo='62907311209' LIMIT 1),NULL,1,'DIN-001-04052026',15.0,15.0,'2026-05-04 00:00:00'),

-- DRC  DISPAL ROJO CARMIN RC    stock_min=35  → 35*3=105
((SELECT id_materia FROM materias_primas WHERE codigo='62907411221' LIMIT 1),NULL,1,'DRC-001-04052026',105.0,105.0,'2026-05-04 00:00:00'),

-- DIR  DISPAL ROJO CARMIN       stock_min=38  → 38*3=114
((SELECT id_materia FROM materias_primas WHERE codigo='62907511220' LIMIT 1),NULL,1,'DIR-001-04052026',114.0,114.0,'2026-05-04 00:00:00'),

-- DAF  DISPAL AZUL FTALO        stock_min=48  → 48*3=144
((SELECT id_materia FROM materias_primas WHERE codigo='62907811177' LIMIT 1),NULL,1,'DAF-001-04052026',144.0,144.0,'2026-05-04 00:00:00'),

-- GOT  GOLD TONNER              stock_min=104 → 104*3=312
((SELECT id_materia FROM materias_primas WHERE codigo='62908011203' LIMIT 1),NULL,1,'GOT-001-04052026',312.0,312.0,'2026-05-04 00:00:00'),

-- PTA  PASTA TRICOTINT A 9070   stock_min=108 → 108*3=324
((SELECT id_materia FROM materias_primas WHERE codigo='62910611209' LIMIT 1),NULL,1,'PTA-001-04052026',324.0,324.0,'2026-05-04 00:00:00'),

-- TA9  TRICOTINT A 9032         stock_min=93  → 93*3=279
((SELECT id_materia FROM materias_primas WHERE codigo='62913311175' LIMIT 1),NULL,1,'TA9-001-04052026',279.0,279.0,'2026-05-04 00:00:00'),

-- TRA  TRICOTINT A 9050         stock_min=131 → 131*3=393
((SELECT id_materia FROM materias_primas WHERE codigo='62913411225' LIMIT 1),NULL,1,'TRA-001-04052026',393.0,393.0,'2026-05-04 00:00:00'),

-- PT6  PREDISPERSO TRICONYL 6018 stock_min=20 → 20*3=60
((SELECT id_materia FROM materias_primas WHERE codigo='63011411167' LIMIT 1),NULL,1,'PT6-001-04052026',60.0,60.0,'2026-05-04 00:00:00'),

-- PRT  PREDISPERSO TRICONYL 6232 stock_min=73 → 73*3=219
((SELECT id_materia FROM materias_primas WHERE codigo='63011511199' LIMIT 1),NULL,1,'PRT-001-04052026',219.0,219.0,'2026-05-04 00:00:00'),

-- PRE  PREDISPERSO TRICONYL 6235 stock_min=69 → 69*3=207
((SELECT id_materia FROM materias_primas WHERE codigo='63011611229' LIMIT 1),NULL,1,'PRE-001-04052026',207.0,207.0,'2026-05-04 00:00:00'),

-- PR1  PREDISPERSO TRICONYL 6367 stock_min=36 → 36*3=108
((SELECT id_materia FROM materias_primas WHERE codigo='63011711175' LIMIT 1),NULL,1,'PR10-001-04052026',108.0,108.0,'2026-05-04 00:00:00'),

-- PR3  PREDISPERSO TRICONYL 6411 stock_min=18 → 18*3=54
((SELECT id_materia FROM materias_primas WHERE codigo='63011911227' LIMIT 1),NULL,1,'PR12-001-04052026',54.0,54.0,'2026-05-04 00:00:00'),

-- PR4  PREDISPERSO TRICONYL 6474 stock_min=57 → 57*3=171
((SELECT id_materia FROM materias_primas WHERE codigo='63012011225' LIMIT 1),NULL,1,'PR13-001-04052026',171.0,171.0,'2026-05-04 00:00:00'),

-- PR5  PREDISPERSO TRICONYL 6718 stock_min=112 → 112*3=336
((SELECT id_materia FROM materias_primas WHERE codigo='63012111209' LIMIT 1),NULL,1,'PR14-001-04052026',336.0,336.0,'2026-05-04 00:00:00'),

-- PND  PREDISPERSO NEGRO B7     stock_min=17  → 17*3=51
((SELECT id_materia FROM materias_primas WHERE codigo='63014211209' LIMIT 1),NULL,1,'PND-001-04052026',51.0,51.0,'2026-05-04 00:00:00'),

-- PRD  PREDISPERSO ROJO R-112   stock_min=62  → 62*3=186
((SELECT id_materia FROM materias_primas WHERE codigo='63015611199' LIMIT 1),NULL,1,'PRD-001-04052026',186.0,186.0,'2026-05-04 00:00:00'),

-- LS4  LEAFING STAPA 4 L        stock_min=121 → 121*3=363
((SELECT id_materia FROM materias_primas WHERE codigo='63108611023' LIMIT 1),NULL,1,'LS4-001-04052026',363.0,363.0,'2026-05-04 00:00:00'),

-- TRU  TRICOTINT U9034          stock_min=169 → 169*3=507
((SELECT id_materia FROM materias_primas WHERE codigo='63113511175' LIMIT 1),NULL,1,'TRU-001-04052026',507.0,507.0,'2026-05-04 00:00:00'),

-- ACV  AMARILLO CROMO VERDOSO   stock_min=170 → 170*3=510
((SELECT id_materia FROM materias_primas WHERE codigo='63205311167' LIMIT 1),NULL,1,'ACV-001-04052026',510.0,510.0,'2026-05-04 00:00:00'),

-- AMA  AZUL MILORI AF-90        stock_min=159 → 159*3=477
((SELECT id_materia FROM materias_primas WHERE codigo='63205911175' LIMIT 1),NULL,1,'AMA-001-04052026',477.0,477.0,'2026-05-04 00:00:00'),

-- ODC  OXIDO DE CROMO ROJIZO    stock_min=196 → 196*3=588
((SELECT id_materia FROM materias_primas WHERE codigo='63209611166' LIMIT 1),NULL,1,'ODC-001-04052026',588.0,588.0,'2026-05-04 00:00:00'),

-- ODH  OXIDO DE HIERRO 4711     stock_min=137 → 137*3=411
((SELECT id_materia FROM materias_primas WHERE codigo='63209711224' LIMIT 1),NULL,1,'ODH-001-04052026',411.0,411.0,'2026-05-04 00:00:00'),

-- OXD  OXIDO DE HIERRO 4781     stock_min=84  → 84*3=252
((SELECT id_materia FROM materias_primas WHERE codigo='63209811191' LIMIT 1),NULL,1,'OXD-001-04052026',252.0,252.0,'2026-05-04 00:00:00'),

-- OXI  OXIDO DE HIERRO AMARILLO stock_min=73  → 73*3=219
((SELECT id_materia FROM materias_primas WHERE codigo='63209911002' LIMIT 1),NULL,1,'OXI-001-04052026',219.0,219.0,'2026-05-04 00:00:00'),

-- OX1  OXIDO DE HIERRO D330     stock_min=43  → 43*3=129
((SELECT id_materia FROM materias_primas WHERE codigo='63210011012' LIMIT 1),NULL,1,'OX10-001-04052026',129.0,129.0,'2026-05-04 00:00:00'),

-- OX2  OXIDO DE HIERRO SY130S   stock_min=111 → 111*3=333
((SELECT id_materia FROM materias_primas WHERE codigo='63210111014' LIMIT 1),NULL,1,'OX11-001-04052026',333.0,333.0,'2026-05-04 00:00:00'),

-- OX4  OXIDO DE HIERRO SY663    stock_min=62  → 62*3=186
((SELECT id_materia FROM materias_primas WHERE codigo='63210211192' LIMIT 1),NULL,1,'OX12-001-04052026',186.0,186.0,'2026-05-04 00:00:00'),

-- OX5  OXIDO DE HIERRO SYD330   stock_min=10  → 10*3=30
((SELECT id_materia FROM materias_primas WHERE codigo='63210311012' LIMIT 1),NULL,1,'OX13-001-04052026',30.0,30.0,'2026-05-04 00:00:00'),

-- PNM  PIGMENTO NARANJA         stock_min=42  → 42*3=126
((SELECT id_materia FROM materias_primas WHERE codigo='63211111100' LIMIT 1),NULL,1,'PNM-001-04052026',126.0,126.0,'2026-05-04 00:00:00'),

-- POR  PIGMENTO ORO RICO        stock_min=38  → 38*3=114
((SELECT id_materia FROM materias_primas WHERE codigo='63211211215' LIMIT 1),NULL,1,'POR-001-04052026',114.0,114.0,'2026-05-04 00:00:00'),

-- PIG  PIGMNETO G105            stock_min=70  → 70*3=210
((SELECT id_materia FROM materias_primas WHERE codigo='63211311226' LIMIT 1),NULL,1,'PIG-001-04052026',210.0,210.0,'2026-05-04 00:00:00'),

-- DDT  DIÓXIDO DE TITANIO 698   stock_min=188 → 188*3=564
((SELECT id_materia FROM materias_primas WHERE codigo='63214111235' LIMIT 1),NULL,1,'DDT-001-04052026',564.0,564.0,'2026-05-04 00:00:00'),

-- HES  HEMIHIDRATO SUCROYESO    stock_min=101 → 101*3=303
((SELECT id_materia FROM materias_primas WHERE codigo='63308411223' LIMIT 1),NULL,1,'HES-001-04052026',303.0,303.0,'2026-05-04 00:00:00'),

-- M4S  MK 40 SL                 stock_min=152 → 152*3=456
((SELECT id_materia FROM materias_primas WHERE codigo='62341311207' LIMIT 1),NULL,1,'M4S-001-04052026',456.0,456.0,'2026-05-04 00:00:00'),

-- ARB  ARACRYL RE-2             stock_min=124 → 124*3=372
((SELECT id_materia FROM materias_primas WHERE codigo='61916311179' LIMIT 1),NULL,1,'ARB-001-04052026',372.0,372.0,'2026-05-04 00:00:00'),

-- PVD  PREDISPERSO VERDE G-7    stock_min=49  → 49*3=147
((SELECT id_materia FROM materias_primas WHERE codigo='63017111225' LIMIT 1),NULL,1,'PVD-001-04052026',147.0,147.0,'2026-05-04 00:00:00'),

-- PRA  PREDISPERSO AZUL B 15:0  stock_min=156 → 156*3=468
((SELECT id_materia FROM materias_primas WHERE codigo='63017011175' LIMIT 1),NULL,1,'PRA-001-04052026',468.0,468.0,'2026-05-04 00:00:00'),

-- SAC  SUDADUR AMARILLO         stock_min=81  → 81*3=243
((SELECT id_materia FROM materias_primas WHERE codigo='66666666' LIMIT 1),NULL,1,'SAC-001-04052026',243.0,243.0,'2026-05-04 00:00:00'),

-- ME7  METEOLAT 780             stock_min=42  → 42*3=126
((SELECT id_materia FROM materias_primas WHERE codigo='6662225555' LIMIT 1),NULL,1,'ME7-001-04052026',126.0,126.0,'2026-05-04 00:00:00'),

-- ADV  ADVANTEX                 stock_min=117 → 117*3=351
((SELECT id_materia FROM materias_primas WHERE codigo='6565656656' LIMIT 1),NULL,1,'ADV-001-04052026',351.0,351.0,'2026-05-04 00:00:00'),

-- TR2  TRIMETÁLICO 233          stock_min=157 → 157*3=471
((SELECT id_materia FROM materias_primas WHERE codigo='6532582' LIMIT 1),NULL,1,'TR2-001-04052026',471.0,471.0,'2026-05-04 00:00:00'),

-- DID  DIÓXIDO DE TITANIO R-6618 stock_min=62 → 62*3=186
((SELECT id_materia FROM materias_primas WHERE codigo='63213211529' LIMIT 1),NULL,1,'DID-001-04052026',186.0,186.0,'2026-05-04 00:00:00'),

-- NF1  NUBIROX FR 10            stock_min=45  → 45*3=135
((SELECT id_materia FROM materias_primas WHERE codigo='652458' LIMIT 1),NULL,1,'NF1-001-04052026',135.0,135.0,'2026-05-04 00:00:00'),

-- FDC  FIBRAS DE CELULOSA       stock_min=114 → 114*3=342
((SELECT id_materia FROM materias_primas WHERE codigo='65458521466' LIMIT 1),NULL,1,'FDC-001-04052026',342.0,342.0,'2026-05-04 00:00:00'),

-- AQS  AQUAPOLYMER SAE 5004     stock_min=99  → 99*3=297
((SELECT id_materia FROM materias_primas WHERE codigo='61934611180' LIMIT 1),NULL,1,'AQS-001-04052026',297.0,297.0,'2026-05-04 00:00:00'),

-- ACE  ACTICIDE EPW             stock_min=21  → 21*3=63
((SELECT id_materia FROM materias_primas WHERE codigo='61934611181' LIMIT 1),NULL,1,'ACE-001-04052026',63.0,63.0,'2026-05-04 00:00:00'),

-- TEX  TEXANOL                  stock_min=29  → 29*3=87
((SELECT id_materia FROM materias_primas WHERE codigo='62315011242' LIMIT 1),NULL,1,'TEX-001-04052026',87.0,87.0,'2026-05-04 00:00:00'),

-- DIB  DISPAL BA                stock_min=193 → 193*3=579
((SELECT id_materia FROM materias_primas WHERE codigo='62939011217' LIMIT 1),NULL,1,'DIB-001-04052026',579.0,579.0,'2026-05-04 00:00:00'),

-- RES  RESINA R-332             stock_min=123 → 123*3=369
((SELECT id_materia FROM materias_primas WHERE codigo='61907711186' LIMIT 1),NULL,1,'RES-001-04052026',369.0,369.0,'2026-05-04 00:00:00'),

-- SV7  SUDAFAST VERDE 7         stock_min=112 → 112*3=336
((SELECT id_materia FROM materias_primas WHERE codigo='6666555222' LIMIT 1),NULL,1,'SV7-001-04052026',336.0,336.0,'2026-05-04 00:00:00'),

-- LE9  LAC E 900 ORO PÁLIDO     stock_min=67  → 67*3=201
((SELECT id_materia FROM materias_primas WHERE codigo='63239411551' LIMIT 1),NULL,1,'LE9-001-04052026',201.0,201.0,'2026-05-04 00:00:00'),

-- CH5  CHEMOMEDSOY 50           stock_min=66  → 66*3=198
((SELECT id_materia FROM materias_primas WHERE codigo='61905211184' LIMIT 1),NULL,1,'CH5-001-04052026',198.0,198.0,'2026-05-04 00:00:00'),

-- AMC  AMC                      stock_min=42  → 42*3=126
((SELECT id_materia FROM materias_primas WHERE codigo='658374' LIMIT 1),NULL,1,'AMC-001-04052026',126.0,126.0,'2026-05-04 00:00:00'),

-- DF1  DEE FO 1015              stock_min=134 → 134*3=402
((SELECT id_materia FROM materias_primas WHERE codigo='623137111721' LIMIT 1),NULL,1,'DF1-001-04052026',402.0,402.0,'2026-05-04 00:00:00'),

-- SY9  SYNTHACRIL 9000          stock_min=37  → 37*3=111
((SELECT id_materia FROM materias_primas WHERE codigo='655482100' LIMIT 1),NULL,1,'SY9-001-04052026',111.0,111.0,'2026-05-04 00:00:00');

-- ==================================================================
-- CONSULTAS ÚTILES DE VERIFICACIÓN
-- ==================================================================

-- Ver stock y estado por materia prima:
-- SELECT mp.nombre, mp.stock_min,
--        ROUND(COALESCE(SUM(l.stock_restante),0),2) AS stock_actual,
--        CASE
--          WHEN ROUND(COALESCE(SUM(l.stock_restante),0),2) <= mp.stock_min       THEN 'Critico'
--          WHEN ROUND(COALESCE(SUM(l.stock_restante),0),2) <= mp.stock_min * 2   THEN 'Bajo'
--          ELSE 'Suficiente'
--        END AS estado_stock
-- FROM materias_primas mp
-- LEFT JOIN lotes l ON mp.id_materia = l.id_materia AND l.estado = 'activo'
-- GROUP BY mp.id_materia, mp.nombre, mp.stock_min
-- ORDER BY estado_stock, mp.nombre;

-- Contar materias por estado:
-- SELECT
--   SUM(CASE WHEN stock_actual <= stock_min       THEN 1 ELSE 0 END) AS criticos,
--   SUM(CASE WHEN stock_actual > stock_min
--             AND stock_actual <= stock_min * 2   THEN 1 ELSE 0 END) AS bajos,
--   SUM(CASE WHEN stock_actual > stock_min * 2    THEN 1 ELSE 0 END) AS suficientes
-- FROM (
--   SELECT mp.stock_min,
--          ROUND(COALESCE(SUM(l.stock_restante),0),2) AS stock_actual
--   FROM materias_primas mp
--   LEFT JOIN lotes l ON mp.id_materia = l.id_materia AND l.estado = 'activo'
--   GROUP BY mp.id_materia, mp.stock_min
-- ) AS resumen;