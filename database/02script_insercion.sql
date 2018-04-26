USE finanzas;

DELETE FROM Par_multivalor;

INSERT INTO Par_multivalor(pm_tabla,pm_codigo,pm_descripcion) VALUES ('SI_NO',0,'No');
INSERT INTO Par_multivalor(pm_tabla,pm_codigo,pm_descripcion) VALUES ('SI_NO',1,'Si');
INSERT INTO Par_multivalor(pm_tabla,pm_codigo,pm_descripcion) VALUES ('DEB_CRE',0,'Credito');
INSERT INTO Par_multivalor(pm_tabla,pm_codigo,pm_descripcion) VALUES ('DEB_CRE',1,'Debito');