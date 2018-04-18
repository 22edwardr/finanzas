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
        const db = require("../db");

        bcrypt.hash(clave , saltRounds ,(err,hash) => {
            const params = [usuario , nombre , correo , hash];

            db.query("INSERT INTO Usuario(u_usuario,u_nombre,u_correo,u_clave) VALUES (?,?,?,?);", params ,
                (err,results) => {
                    if (err) throw err;
                    req.login(results.insertId, err => {
                        res.redirect("/");
                        console.log("Registro exitoso");
                        db.end();
                    });
                }
            )
        });
    }
    
});

/* GET /logout */
router.get("/logout", (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect("/");
  })

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
