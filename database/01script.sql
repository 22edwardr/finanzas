DROP DATABASE finanzas;

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
