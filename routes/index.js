var express = require('express');
var router = express.Router();
const expressValidator = require("express-validator");
const passport = require("passport");
const bcrypt = require('bcrypt')

const db = require("../db");
const saltRounds = 10; 







// Logueo

router.get("/Login", (req, res) => {
    res.render("login", { titulo: "Ingreso", isLogin: true });
});

router.post("/LoginToggle", (req, res) => {
    if(req.body.LoginToggle == "Registro")
        res.render("login", { titulo: "Registro", isLogin: false });
    else
        res.redirect('/Login');
});

router.get("/", authenticationMiddleware(), (req,res) => {
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render("index",{ active: "index"});   
});

router.post("/Ingreso", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/Login'
  }));

router.post("/Registro",(req,res)=> {
    const { usuario , nombre , correo , clave , clave2 } = req.body;

    req.checkBody("usuario","El usuario no puede ser vacio").notEmpty();

    req.checkBody("nombre","El nombre no puede ser vacio").notEmpty();

    req.checkBody("correo","El correo no puede ser vacio").notEmpty();
    req.checkBody("correo","El correo ingresado es invalido").isEmail();

    req.checkBody("clave","La clave debe tener minimo 8 caracteres").len(8,100);
    req.checkBody("clave","La clave debe incluir una letra minúscula, una mayúscula, un numero y un caracter especial").matches(/^(?=.*\d)(?=.*[a-z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");

    req.checkBody("clave2","Las claves ingresadas no coinciden").equals(clave);

    const errores = req.validationErrors();

    if (errores) {
        console.log(`errors: ${JSON.stringify(errores)}`);
        res.render("login", { titulo: "Registro", isLogin: false, errores });
    } else {
        bcrypt.hash(clave , saltRounds ,(err,hash) => {
            const params = [usuario , nombre , correo , hash];

            db.query("INSERT INTO Usuario(u_usuario,u_nombre,u_correo,u_clave) VALUES (?,?,?,?);", params ,
                (err,results) => {
                    if (err) throw err;
                    req.login(results.insertId, err => {
                        res.redirect("/");
                        console.log("Registro exitoso");
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
    buscarTiposDebitoCredito(res);
});

router.post("/tipoDebitoCredito",authenticationMiddleware(), (req,res) => {
    const { codigo , id,  nombre ,  descripcion , naturaleza ,  color, deseado, balance, submit } = req.body;


    if(submit != 'del'){
        req.checkBody(submit == "mod" ? "id" : "codigo","El codigo no puede ser nulo").notEmpty();
        req.checkBody("nombre","El nombre no puede ser nulo").notEmpty();
        req.checkBody("color","Este no es un color valido").matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        req.checkBody("deseado","El porcentaje deseado debe ser numerico entre 0 y 100").isNumeric();
        if(submit != 'mod')
            req.checkBody("naturaleza","La naturaleza no puede ser nula").notEmpty();
        
        let errores = req.validationErrors();

        if(!errores && (deseado < 0 || deseado > 100 ))
            errores = [{msg: "El porcentaje deseado debe ser numerico entre 0 y 100"}];

        if(errores)
        buscarTiposDebitoCredito(res,errores);
        else{
            if(submit == "mod"){
                let params = [nombre,descripcion,deseado,color,id];
                db.query("UPDATE Tipo_debito_credito SET tdc_nombre = ? , tdc_descripcion = ? , tdc_deseado = ?, tdc_color = ? WHERE tdc_codigo = ?;", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarTiposDebitoCredito(res,[{msg: "Actualizacion exitosa"}]);
                    }
                );
            }else{
                let params = [codigo,nombre,descripcion,naturaleza,deseado,color];
                db.query("INSERT INTO Tipo_debito_credito(tdc_codigo,tdc_nombre,tdc_descripcion,tdc_naturaleza, tdc_deseado,tdc_color,tdc_fecha) VALUES (?,?,?,?,?,?,now());", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarTiposDebitoCredito(res,[{msg: "Inserción exitosa"}]);
                    }
                );
            }
        }
    }else{
        req.checkBody("id","El codigo no puede ser nulo").notEmpty();
        let errores = req.validationErrors();
        if(errores)
        buscarTiposDebitoCredito(res,errores);
        else{
            let params = [id];
            db.query("DELETE FROM Tipo_debito_credito WHERE tdc_codigo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarTiposDebitoCredito(res,[{msg: "Eliminación exitosa"}]);
                }
            );
        }
    }
    
});


function buscarTiposDebitoCredito(res,errores){
    db.query('SELECT tdc_codigo,tdc_nombre,tdc_descripcion,(tdc_deseado- tdc_promedio) tdc_balance, tdc_naturaleza,pm_descripcion tdc_naturalezaTexto,tdc_deseado,tdc_color ' +
     ' FROM Tipo_debito_credito LEFT JOIN Par_multivalor ' +
     ' ON pm_tabla=\'DEB_CRE\' AND pm_codigo = tdc_naturaleza ORDER BY tdc_codigo', null, (err, results) => {
        if (err){
            throw err;
        } 
        
        obtenerParMultivalores("DEB_CRE",(err,naturalezas) => {
            if(err) throw err;

            if (results.length === 0) {
                let errorNuevo = {msg: "No se encontraron registros"};
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






//ParMultivalores

router.get("/parMultivalor", authenticationMiddleware(), (req, res) => {
    buscarParMultivalores(res);
});

router.post("/parMultivalor",authenticationMiddleware(), (req,res) => {

    const { tabla , idTabla,  codigo ,  idCodigo , descripcion ,  numerico, texto, fecha, submit } = req.body;


    if(submit != 'del'){
        req.checkBody(submit == "mod" ? "idTabla" : "tabla","La tabla no puede ser nula").notEmpty();
        req.checkBody(submit == "mod" ? "idCodigo" : "codigo","El codigo debe ser numerico").isNumeric();
        req.checkBody("descripcion","La descripcion no puede ser nula").notEmpty();
        if(numerico)
            req.checkBody("numerico","El valor ingresado debe ser numérico").isNumeric();

        console.log(numerico);

        
        let errores = req.validationErrors();

        if(errores)
            buscarParMultivalores(res,errores);
        else{
            if(submit == "mod"){
                let params = [descripcion,numerico,texto,fecha,idTabla,idCodigo];
                db.query("UPDATE Par_Multivalor SET pm_descripcion = ? , pm_numerico = ? , pm_texto = ?, pm_fecha = ? WHERE pm_tabla = ? AND pm_codigo = ?;", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarParMultivalores(res,[{msg: "Actualizacion exitosa"}]);
                    }
                );
            }else{
                let params = [tabla,codigo,descripcion,numerico,texto,fecha];
                db.query("INSERT INTO Par_Multivalor(pm_tabla,pm_codigo,pm_descripcion,pm_numerico, pm_texto,pm_fecha) VALUES (?,?,?,?,?,?);", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarParMultivalores(res,[{msg: "Inserción exitosa"}]);
                    }
                );
            }
        }
    }else{
        req.checkBody("idTabla" ,"La tabla no puede ser nula").notEmpty();
        req.checkBody("idCodigo","El codigo no puede ser nulo").notEmpty();
        let errores = req.validationErrors();
        if(errores)
            buscarParMultivalores(res,errores);
        else{
            let params = [idTabla,idCodigo];
            db.query("DELETE FROM Par_Multivalor WHERE pm_tabla = ? AND pm_codigo = ? ;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarParMultivalores(res,[{msg: "Eliminación exitosa"}]);
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
            let errorNuevo = {msg: "No se encontraron registros"};
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






//Generalidades

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
