var express = require('express');
var router = express.Router();
var i18n = require('i18n')
const expressValidator = require("express-validator");
const passport = require("passport");
const bcrypt = require('bcrypt')
const db = require("../db");
const saltRounds = 10; 








// Logueo

router.get("/Login", (req, res) => {
    res.render("login", { titulo: res.__('Ingreso'), isLogin: true });
});

router.post("/LoginToggle", (req, res) => {
    if(req.body.LoginToggle == "Registro")
        res.render("login", { titulo: res.__('Registro'), isLogin: false });
    else
        res.redirect('/Login');
});

router.get("/", authenticationMiddleware(), (req,res) => {
    if(req.cookies.i18n == undefined)
        res.setLocale('en')
    else
        res.setLocale(req.cookies.i18n)
    
    console.log(req.isAuthenticated());

    res.render("index",{ active: "index"});   
});

router.post("/Ingreso", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/Login'
  }));

router.post("/Registro",(req,res)=> {
    const { usuario , nombre , correo , clave , clave2 } = req.body;

    req.checkBody("usuario",res.__('El usuario no puede ser vacio')).notEmpty();

    req.checkBody("nombre",res.__('El nombre no puede ser vacio')).notEmpty();

    req.checkBody("correo",res.__('El correo ingresado es inválido')).isEmail();

    req.checkBody("clave",res.__('La clave debe tener mínimo 8 caracteres')).len(8,100);
    req.checkBody("clave",res.__('La clave debe incluir una letra minúscula, una mayúscula, un número y un caracter especial')).matches(/^(?=.*\d)(?=.*[a-z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");

    req.checkBody("clave2",res.__('Las claves ingresadas no coinciden')).equals(clave);

    const errores = req.validationErrors();

    if (errores) {
        res.render("login", { titulo: res.__('Registro'), isLogin: false, errores });
    } else {
        bcrypt.hash(clave , saltRounds ,(err,hash) => {
            const params = [usuario , nombre , correo , hash];

            db.query("INSERT INTO Usuario(u_usuario,u_nombre,u_correo,u_clave) VALUES (?,?,?,?);", params ,
                (err,results) => {
                    if (err) throw err;
                    req.login(results.insertId, err => {
                        res.redirect("/");
                        console.log(res.__('Registro exitoso'));
                    });
                }
            );
        });
    }
    
});


router.get("/logout", (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect("/");
  });



//Tipo Debito Credito

router.get("/tipoDebitoCredito", authenticationMiddleware(), (req, res) => {
    let usuario = req.session.passport.user;
    buscarTiposDebitoCredito(usuario,res);
});

router.post("/tipoDebitoCredito",authenticationMiddleware(), (req,res) => {
    const { codigo , consecutivo ,  nombre ,  descripcion , naturaleza ,  color, deseado, balance, submit } = req.body;
    let usuario = req.session.passport.user;

    if( submit != "del"){
        req.checkBody("codigo",res.__('El código no puede ser nulo')).notEmpty();
        req.checkBody("nombre",res.__('El nombre no puede ser nulo')).notEmpty();
        req.checkBody("color",res.__('El color es inválido')).matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        req.checkBody("deseado",res.__('El valor deseado debe ser numérico')).isNumeric();
    }

    if(submit == 'ins')
        req.checkBody("naturaleza",res.__('La naturaleza no puede ser nula')).notEmpty();
    else
        req.checkBody("consecutivo",res.__('El identificador no puede ser nulo')).isNumeric();
    
    let errores = req.validationErrors();

    if(errores)
        buscarTiposDebitoCredito(usuario,res,errores);
    else {
        if(submit == "mod"){
            let params = [codigo,nombre,descripcion,deseado,color,consecutivo];
            db.query("UPDATE Tipo_debito_credito SET tdc_codigo = ? ,tdc_nombre = ? , tdc_descripcion = ? , tdc_deseado = ?, tdc_color = ? WHERE tdc_consecutivo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarTiposDebitoCredito(usuario,res,[{msg: res.__('Actualización exitosa')}]);
                }
            );
        }else if(submit == "ins"){
            let params = [codigo,usuario,nombre,descripcion,naturaleza,deseado,color];
            db.query("INSERT INTO Tipo_debito_credito(tdc_codigo,u_usuario,tdc_nombre,tdc_descripcion,tdc_naturaleza, tdc_deseado,tdc_color,tdc_fecha) VALUES (?,?,?,?,?,?,?,now());", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarTiposDebitoCredito(usuario,res,[{msg: res.__('Inserción exitosa')}]);
                }
            );
        } else{
            let params = [consecutivo];
            db.query("DELETE FROM Tipo_debito_credito WHERE tdc_consecutivo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarTiposDebitoCredito(usuario,res,[{msg: res.__('Eliminación exitosa')}]);
                }
            );
        }

    }
});


function buscarTiposDebitoCredito(usuario,res,errores){
    db.query('SELECT tdc_consecutivo,tdc_codigo,tdc_nombre,tdc_descripcion,(tdc_deseado- tdc_promedio) tdc_balance, tdc_naturaleza,pm_descripcion tdc_naturalezaTexto,tdc_deseado,tdc_color ' +
     ' FROM Tipo_debito_credito LEFT JOIN Par_multivalor ' +
     ' ON pm_tabla=\'DEB_CRE\' AND pm_codigo = tdc_naturaleza WHERE u_usuario = ? ORDER BY tdc_codigo', [usuario], (err, results) => {
        if (err){
            throw err;
        } 
        
        obtenerParMultivalores("DEB_CRE",(err,naturalezas) => {
            if(err) throw err;

            if (results.length === 0) {
                let errorNuevo = {msg: res.__('No se encontraron registros')};
                if(errores)
                    errores.push(errorNuevo);
                else
                    errores = [errorNuevo];
                res.render("tipoDebitoCredito", { active: "tipoDebitoCredito", naturalezas, errores});
            } else {
                for(let i=0 ; i<results.length ; i++){
                    if(results[i].tdc_balance < 0)
                        results[i].tdc_color_balance = "red";
                    else
                        results[i].tdc_color_balance = "green";
                }
                res.render("tipoDebitoCredito", { active: "tipoDebitoCredito", results, naturalezas, errores});
            }
        });
    });
}

function obtenerTiposDebitoCredito(usuario, cb){
    let parameters = [usuario];
    console.log(usuario);
    db.query('SELECT * FROM Tipo_Debito_Credito WHERE u_usuario = ?', parameters, (err, results) => {
        cb(err,results);
    });
}

function obtenerTiposDebitoCreditoOrdenPopular(usuario, cb){
    let parameters = [usuario];
    console.log(usuario);
    db.query('SELECT count(tdc_consecutivo) popular,tdc_consecutivo,tdc_codigo FROM tipo_debito_credito tdc JOIN debito_credito dc  ON tdc_tipo_debito_credito=tdc_consecutivo LEFT JOIN movimiento m ON m.dc_debito_credito=dc_consecutivo WHERE tdc.u_usuario = 1 GROUP BY tdc_consecutivo,tdc_codigo ORDER BY popular desc', parameters, (err, results) => {
        cb(err,results);
    });
}



//Debito Credito

router.get("/debitoCredito", authenticationMiddleware(), (req, res) => {
    let usuario = req.session.passport.user;
    buscarDebitosCredito(usuario,res);
});

router.post("/debitoCredito",authenticationMiddleware(), (req,res) => {
    const { consecutivo ,  nombre ,  descripcion , tipo ,  color, deseado, balance, submit } = req.body;
    let usuario = req.session.passport.user;

    if( submit != "del"){
        req.checkBody("nombre",res.__('El nombre no puede ser nulo')).notEmpty();
        req.checkBody("tipo",res.__('El tipo no puede ser nulo')).isNumeric();
        req.checkBody("color",res.__('El color es inválido')).matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        req.checkBody("deseado",res.__('El valor deseado debe ser numérico')).isNumeric();
        
    }

    if(submit != 'ins')
        req.checkBody("consecutivo",res.__('El identificador no puede ser nulo')).isNumeric();
    
    let errores = req.validationErrors();

    if(errores)
        buscarDebitosCredito(usuario,res,errores);
    else {
        if(submit == "mod"){
            let params = [nombre,descripcion,tipo,deseado,color,consecutivo];
            db.query("UPDATE Debito_credito SET dc_nombre = ? , dc_descripcion = ? , tdc_tipo_debito_credito = ? , dc_deseado = ?, dc_color = ? WHERE dc_consecutivo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarDebitosCredito(usuario,res,[{msg: res.__('Actualización exitosa')}]);
                }
            );
        }else if(submit == "ins"){
            let params = [nombre,descripcion,tipo,deseado,color];
            db.query("INSERT INTO Debito_credito(dc_nombre,dc_descripcion,tdc_tipo_debito_credito, dc_deseado,dc_color,dc_fecha) VALUES (?,?,?,?,?,now());", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarDebitosCredito(usuario,res,[{msg: res.__('Inserción exitosa')}]);
                }
            );
        } else{
            let params = [consecutivo];
            db.query("DELETE FROM Debito_credito WHERE dc_consecutivo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarDebitosCredito(usuario,res,[{msg: res.__('Eliminación exitosa')}]);
                }
            );
        }

    }
});


function buscarDebitosCredito(usuario,res,errores){
    db.query('SELECT dc_consecutivo,dc_nombre,dc_descripcion,(dc_deseado- dc_promedio) dc_balance, tdc_tipo_debito_credito dc_tipo,tdc_nombre dc_tipoTexto,dc_deseado,dc_color ' +
     ' FROM Debito_Credito JOIN Tipo_Debito_Credito ' +
     ' ON tdc_consecutivo = tdc_tipo_debito_credito WHERE u_usuario = ? ORDER BY dc_nombre', [usuario], (err, results) => {
        if (err){
            throw err;
        } 
        
        obtenerTiposDebitoCredito(usuario,(err,tiposDebitoCredito) => {
            if(err) throw err;

            if (results.length === 0) {
                let errorNuevo = {msg: res.__('No se encontraron registros')};
                if(errores)
                    errores.push(errorNuevo);
                else
                    errores = [errorNuevo];
                res.render("debitoCredito", { active: "debitoCredito", tiposDebitoCredito, errores});
            } else {
                for(let i=0 ; i<results.length ; i++){
                    if(results[i].tdc_balance < 0)
                        results[i].dc_color_balance = "red";
                    else
                        results[i].dc_color_balance = "green";
                }
                res.render("debitoCredito", { active: "debitoCredito", results, tiposDebitoCredito, errores});
            }
        });
    });
}

function buscarDebitosCreditoPorTipo(tipo, cb){
    let parameters = [tipo];
    db.query('SELECT * FROM Debito_Credito WHERE tdc_tipo_debito_credito = ? ORDER BY dc_nombre ', parameters, (err, results) => {
        cb(err,results);
    });
}





//ParMultivalores

router.get("/parMultivalor", authenticationMiddleware(), (req, res) => {
    buscarParMultivalores(res);
});

router.post("/parMultivalor",authenticationMiddleware(), (req,res) => {

    const { tabla , idTabla,  codigo ,  idCodigo , descripcion ,  numerico, texto, fecha, submit } = req.body;

    req.checkBody(submit != "ins" ? "idTabla" : "tabla",res.__('La tabla no puede ser nula')).notEmpty();
    req.checkBody(submit != "ins" ? "idCodigo" : "codigo",res.__('El código debe ser numérico')).isNumeric();
    if( submit != "del"){
        req.checkBody("descripcion",res.__('La descripción no puede ser nula')).notEmpty();
        req.checkBody("numerico",res.__('El valor ingresado debe ser numérico')).optional({nullable: true , checkFalsy : true}).isNumeric();
    }

    let errores = req.validationErrors();

    if(errores)
        buscarParMultivalores(res,errores);
    else{
        if(submit == "mod"){
            let params = [descripcion,numerico,texto,fecha,idTabla,idCodigo];
            db.query("UPDATE Par_Multivalor SET pm_descripcion = ? , pm_numerico = ? , pm_texto = ?, pm_fecha = ? WHERE pm_tabla = ? AND pm_codigo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarParMultivalores(res,[{msg: res.__('Actualización exitosa')}]);
                }
            );
        }else if (submit == "ins"){
            let params = [tabla,codigo,descripcion,numerico,texto,fecha];
            db.query("INSERT INTO Par_Multivalor(pm_tabla,pm_codigo,pm_descripcion,pm_numerico, pm_texto,pm_fecha) VALUES (?,?,?,?,?,?);", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarParMultivalores(res,[{msg: res.__('Inserción exitosa')}]);
                }
            );
        } else{
            let params = [idTabla,idCodigo];
            db.query("DELETE FROM Par_Multivalor WHERE pm_tabla = ? AND pm_codigo = ? ;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarParMultivalores(res,[{msg: res.__('Eliminación exitosa')}]);
                }
            );
        }
    }     
    
});


function buscarParMultivalores(res,errores){
    db.query('SELECT * FROM par_multivalor ORDER BY pm_tabla,pm_codigo', null, (err, results) => {
        if (err){
            throw err;
        } 
        if (results.length === 0) {
            let errorNuevo = {msg: res.__('No se encontraron registros')};
            if(errores)
                errores.push(errorNuevo);
            else
                errores = [errorNuevo];
            res.render("parMultivalor", { active: "parMultivalor",  errores});
        } else {
            res.render("parMultivalor", { active: "parMultivalor", results,  errores});
        }
    });
}

function obtenerParMultivalores(tabla, cb){
    let parameters = [tabla];
    db.query('SELECT * FROM Par_multivalor WHERE pm_tabla = ?', parameters, (err, results) => {
        cb(err,results);
    });
}


//Fuentes


router.get("/fuente", authenticationMiddleware(), (req, res) => {
    let usuario = req.session.passport.user;
    buscarFuentes(usuario , res);
});

router.post("/fuente",authenticationMiddleware(), (req,res) => {

    const {  consecutivo  , nombre , descripcion ,  fechaInicial , fechaFinal , submit } = req.body;
    let usuario = req.session.passport.user;


    if(submit != 'del'){
        req.checkBody("nombre",res.__('El nombre no puede ser nulo')).notEmpty();
        req.checkBody("fechaInicial",res.__('La fecha inicial no puede ser nula')).notEmpty();
        req.checkBody("fechaFinal",res.__('La fecha inicial debe ser menor a la fecha final')).optional({nullable: true , checkFalsy: true}).isAfter(fechaInicial);
    }
    if(submit != 'ins')
        req.checkBody("consecutivo",res.__('El identificador no puede ser nulo')).isNumeric();
    
        
    let errores = req.validationErrors();

    if(errores)
        buscarFuentes(usuario,res,errores);
    else{
        if(submit == "mod"){
            let params = [nombre,descripcion,fechaInicial,fechaFinal,consecutivo];
            db.query("UPDATE fuente SET f_nombre = ? ,f_descripcion = ?, f_fecha_inicial = ? , f_fecha_final = ? WHERE f_consecutivo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarFuentes(usuario,res,[{msg: res.__('Actualización exitosa')}]);
                }
            );
        }else if(submit == "ins"){
            let params = [consecutivo,usuario,nombre,descripcion,fechaInicial,fechaFinal];
            db.query("INSERT INTO fuente(f_consecutivo,u_usuario,f_nombre,f_descripcion,f_fecha_inicial,f_fecha_final) VALUES (?,?,?,?,?,?);", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarFuentes(usuario,res,[{msg:  res.__('Inserción exitosa')}]);
                }
            );
        }
        else{
            let params = [consecutivo];
            db.query("DELETE FROM fuente WHERE f_consecutivo = ? ;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarFuentes(usuario,res,[{msg:  res.__('Eliminación exitosa')}]);
                }
            );
        }
    }
    
});


function buscarFuentes(usuario,res,errores){
    db.query("SELECT f_consecutivo,f_nombre,f_descripcion, DATE_FORMAT(f_fecha_inicial, '%Y-%m-%d') as f_fecha_inicial , " +
                " DATE_FORMAT(f_fecha_final, '%Y-%m-%d') as f_fecha_final FROM fuente WHERE u_usuario = ? ORDER BY f_nombre", [usuario], (err, results) => {
        if (err){
            throw err;
        } 
        
        if (results.length === 0) {
            let errorNuevo = {msg:  res.__('No se encontraron registros')};
            if(errores)
                errores.push(errorNuevo);
            else
                errores = [errorNuevo];
            res.render("fuente", { active: "fuente",  errores});
        } else {
            res.render("fuente", { active: "fuente", results,  errores});
        }
    });
}


function obtenerFuentes(usuario, cb){
    let parameters = [usuario];
    db.query('SELECT count(m_consecutivo) popular,f_consecutivo,f_nombre FROM Fuente f LEFT JOIN Movimiento m  ON f_fuente=f_consecutivo WHERE f.u_usuario = ? GROUP BY f_consecutivo,f_nombre ORDER BY popular desc ', 
    parameters, (err, results) => {
        cb(err,results);
    });
}

//Movimiento

router.get("/movimiento", authenticationMiddleware(), (req,res) => {
    let usuario = req.session.passport.user;
    errores = [];
    obtenerFuentes(usuario,(err,fuentes) => {
        if(err) throw err;
            if (fuentes.length === 0) {
                let errorNuevo = {msg: res.__('No se encontraron fuentes')};
                if(errores)
                    errores.push(errorNuevo);
                else
                    errores = [errorNuevo];
                res.render("movimiento", { active: "movimiento" , errores});
            } else {
                obtenerTiposDebitoCreditoOrdenPopular(usuario,(err,tiposDebitoCredito) => {
                    if(err) throw err;
        
                    if (tiposDebitoCredito.length === 0) {
                        let errorNuevo = {msg: res.__('No se encontraron Tipos Débito Crédito')};
                        if(errores)
                            errores.push(errorNuevo);
                        else
                            errores = [errorNuevo];
                        res.render("movimiento", { active: "movimiento", fuentes, errores});
                    } else {
                        res.render("movimiento", { active: "movimiento", tiposDebitoCredito, fuentes , errores});
                    }
                });
            }
    });
});

router.get('/movimiento/debitoCredito/:tipo', function(req, res){ 
    let tipo = req.params.tipo;

    buscarDebitosCreditoPorTipo(tipo,(err,debitosCreditos) => {
        if (err) throw err;
        res.json(debitosCreditos);
    });
});

router.post("/movimiento",authenticationMiddleware(), (req,res) => {

for (var param in req.body) {
    if(param.includes("valor")){
        let 
    }
    console.log("hey"+ param+"->"+req.body[param]);
}


    let usuario = req.session.passport.user;
    res.redirect('/movimiento');
    
});

//Generalidades

router.get("/cambioIdioma",(req, res) => {
    res.cookie('i18n',req.query.lang);
    res.redirect("/");
});

passport.serializeUser((user, done) => {
    done(null, user);
});
  
passport.deserializeUser((user, done) => {
    done(null, user)
});

function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        if (req.isAuthenticated()) return next();
            res.redirect('/login');
    }
}
  



module.exports = router;
