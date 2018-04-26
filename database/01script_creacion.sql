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

CREATE TABLE Par_multivalor(
	pm_tabla VARCHAR(10) NOT NULL,
	pm_codigo TINYINT NOT NULL,
	pm_descripcion VARCHAR(30) NOT NULL,
	pm_numerico INT NULL,
	pm_texto VARCHAR(100) NULL,
	pm_fecha DATETIME NULL,
	PRIMARY KEY(pm_tabla,pm_codigo) 
);

CREATE TABLE Tipo_Debito_Credito(
	tdc_codigo VARCHAR(2) NOT NULL,
	tdc_nombre VARCHAR(30) NOT NULL,
	tdc_descripcion VARCHAR(200) NULL,
	tdc_promedio DECIMAL(5,2) NULL,
	tdc_deseado DECIMAL(5,2) NOT NULL,
	tdc_naturaleza TINYINT NOT NULL,
	tdc_color VARCHAR(7) NULL,
	tdc_ajuste TINYINT NOT NULL,
	tdc_fecha DATETIME NOT NULL,
	PRIMARY KEY(tdc_codigo)
);

CREATE TABLE Fuente(
	f_codigo VARCHAR(5) NOT NULL,
	f_nombre VARCHAR(30) NOT NULL,
	f_descripcion VARCHAR(200) NULL,
	f_fecha_inicial DATETIME NOT NULL,
	f_fecha_final DATETIME NULL,
	PRIMARY KEY(f_codigo)
);

CREATE TABLE Movimiento(
	m_codigo int AUTO_INCREMENT,
	m_nombre VARCHAR(30) NOT NULL,
	m_descripcion VARCHAR(200) NULL,
	tdc_tipo_debito_credito VARCHAR(2) NOT NULL,
	m_valor DECIMAL(14,2) NOT NULL,
	m_cantidad DECIMAL(2,0) NULL,
	m_fecha DATETIME NOT NULL,
	f_fuente VARCHAR(5) NOT NULL,
	PRIMARY KEY(m_codigo),
	FOREIGN KEY (tdc_tipo_debito_credito) REFERENCES Tipo_Debito_Credito(tdc_codigo),
	FOREIGN KEY (f_fuente) REFERENCES Fuente(f_codigo)
);