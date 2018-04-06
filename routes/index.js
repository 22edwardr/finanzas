var express = require('express');
var router = express.Router();









/* GET home page. */
router.get('/', function(req, res, next) {
if(!req.session.user)
  res.render('login',{});
else
  res.render('index',{usuario:req.session.user});

});


router.get('/Ingresar', function(req, res, next) {
  if(!req.session.user)
    res.render('login');
  else
    res.render('index',{usuario:req.session.user});
});

router.post('/Ingresar', function(req, res, next) {
  var usuario = req.body.usuario;
  var clave = req.body.clave;

  if(usuario && clave){
      req.session.user = usuario;
      res.render('index',{usuario:req.session.user});
  }else
      res.render('login');
});

router.get('/Salir',(req,res,next) => {
  req.session.user = null;
  res.render('login');
})

module.exports = router;
