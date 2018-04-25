CREATE DATABASE finanzas;

USE finanzas;

CREATE TABLE Usuario(
	u_consecutivo INT AUTO_INCREMENT,
	u_usuario VARCHAR(30),
	u_nombre VARCHAR(60),
	u_clave VARCHAR(100),
	u_correo VARCHAR(30),
	PRIMARY KEY(u_consecutivo)
);

CREATE TABLE Tipo_Gasto(
	tg_codigo VARCHAR(2),
	tg_nombre VARCHAR(30),
	tg_descripcion VARCHAR(200),
	tg_promedio DECIMAL(5,2),
	tg_deseado DECIMAL(5,2),
	tg_color VARCHAR(7),
	PRIMARY KEY(tg_codigo)
);

