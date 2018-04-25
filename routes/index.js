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
    res.render("index");   
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




//Tipo Gastos

router.get("/tipoGasto", authenticationMiddleware(), (req, res) => {
    buscarTipoGastos(res);
});

router.post("/tipoGasto",authenticationMiddleware(), (req,res) => {
    const { codigo , id,  nombre ,  descripcion , color, deseado, balance, submit } = req.body;


    if(submit != 'del'){
        req.checkBody(submit == "mod" ? "id" : "codigo","El codigo no puede ser nulo").notEmpty();
        req.checkBody("nombre","El nombre no puede ser nulo").notEmpty();
        req.checkBody("color","Este no es un color valido").matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        req.checkBody("deseado","El porcentaje deseado debe ser numerico entre 0 y 100").isNumeric();
        let errores = req.validationErrors();

        if(!errores && (deseado < 0 || deseado > 100 ))
            errores = [{msg: "El porcentaje deseado debe ser numerico entre 0 y 100"}];

        if(errores)
            buscarTipoGastos(res,errores);
        else{
            if(submit == "mod"){
                let params = [nombre,descripcion,deseado,color,id];
                db.query("UPDATE Tipo_Gasto SET tg_nombre = ? , tg_descripcion = ? , tg_deseado = ?, tg_color = ? WHERE tg_codigo = ?;", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarTipoGastos(res,[{msg: "Actualizacion exitosa"}]);
                    }
                );
            }else{
                let params = [codigo,nombre,descripcion,deseado,color];
                db.query("INSERT INTO Tipo_Gasto(tg_codigo,tg_nombre,tg_descripcion,tg_deseado,tg_color) VALUES (?,?,?,?,?);", params ,
                    (err,results) => {
                        if (err) throw err;
                        buscarTipoGastos(res,[{msg: "Inserción exitosa"}]);
                    }
                );
            }
        }
    }else{
        req.checkBody("id","El codigo no puede ser nulo").notEmpty();
        let errores = req.validationErrors();
        if(errores)
            buscarTipoGastos(res,errores);
        else{
            let params = [id];
            db.query("DELETE FROM Tipo_Gasto WHERE tg_codigo = ?;", params ,
                (err,results) => {
                    if (err) throw err;
                    buscarTipoGastos(res,[{msg: "Eliminación exitosa"}]);
                }
            );
        }
    }
    
});


function buscarTipoGastos(res,errores){
    db.query('SELECT tg_codigo,tg_nombre,tg_descripcion,(tg_deseado- tg_promedio) tg_balance ,tg_deseado,tg_color FROM Tipo_Gasto ORDER BY tg_codigo', null, (err, results) => {
        if (err){
            throw err;
        } 
    
        if (results.length === 0) {
            let errorNuevo = {msg: "No se encontraron registros"};
            if(errores)
                errores.push(errorNuevo);
            else
                errores = [errorNuevo];
            res.render("tipoGasto", { active: "tipoGasto", errores});
        } else {
            for(let i=0 ; i<results.length ; i++){
                if(results[i].tg_balance < 0)
                    results[i].tg_color_balance = "red";
                else
                    results[i].tg_color_balance = "green";
            }
            res.render("tipoGasto", { active: "tipoGasto", results, errores});
        }
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
