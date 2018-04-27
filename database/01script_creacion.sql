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
	tdc_consecutivo INT AUTO_INCREMENT,
	tdc_codigo VARCHAR(3) NOT NULL,
	u_usuario INT NOT NULL,
	tdc_nombre VARCHAR(30) NOT NULL,
	tdc_descripcion VARCHAR(200) NULL,
	tdc_promedio DECIMAL(14,2) NULL,
	tdc_deseado DECIMAL(14,2) NOT NULL,
	tdc_naturaleza TINYINT NOT NULL,	
	tdc_color VARCHAR(7) NULL,
	tdc_fecha DATETIME NOT NULL,
	FOREIGN KEY (u_usuario) REFERENCES Usuario(u_consecutivo),
	PRIMARY KEY(tdc_consecutivo)
);

CREATE TABLE Debito_Credito(
	dc_consecutivo INT AUTO_INCREMENT,
	tdc_tipo_debito_credito INT NOT NULL,
	dc_nombre VARCHAR(30) NOT NULL,
	dc_descripcion VARCHAR(200) NULL,
	dc_promedio DECIMAL(14,2) NULL,
	dc_deseado DECIMAL(14,2) NOT NULL,
	dc_color VARCHAR(7) NULL,
	dc_fecha DATETIME NOT NULL,
	FOREIGN KEY (tdc_tipo_debito_credito) REFERENCES Tipo_Debito_Credito(tdc_consecutivo),
	PRIMARY KEY(dc_consecutivo)
);

CREATE TABLE Fuente(
	f_consecutivo INT AUTO_INCREMENT,
	u_usuario INT NOT NULL,
	f_nombre VARCHAR(30) NOT NULL,
	f_descripcion VARCHAR(200) NULL,
	f_fecha_inicial DATETIME NOT NULL,
	f_fecha_final DATETIME NULL,
	FOREIGN KEY (u_usuario) REFERENCES Usuario(u_consecutivo),
	PRIMARY KEY(f_consecutivo)
);

CREATE TABLE Movimiento(
	m_consecutivo int AUTO_INCREMENT,
	u_usuario INT NOT NULL,
	f_fuente INT NOT NULL,
	dc_debito_credito INT NOT NULL,
	m_nombre VARCHAR(30) NOT NULL,
	m_descripcion VARCHAR(200) NULL,	
	m_valor DECIMAL(14,2) NOT NULL,
	m_cantidad DECIMAL(2,0) NULL,
	m_fecha DATETIME NOT NULL,
	FOREIGN KEY (dc_debito_credito) REFERENCES Debito_Credito(dc_consecutivo),
	FOREIGN KEY (f_fuente) REFERENCES Fuente(f_consecutivo),
	FOREIGN KEY (u_usuario) REFERENCES Usuario(u_consecutivo),
	PRIMARY KEY(m_consecutivo)
);