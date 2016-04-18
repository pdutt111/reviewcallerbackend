var express = require('express');

var router = express.Router();
var params = require('parameters-middleware');
var config= require('config');
var events = require('../events');
var jwt = require('jwt-simple');
var moment= require('moment');
var ObjectId = require('mongoose').Types.ObjectId;
var db=require('../db/DbSchema');
var crypto=require('../authentication/crypto');
var log = require('tracer').colorConsole(config.get('log'));
var userTable;
var reviewTable;
var pinTable;
events.emitter.on("db_data",function(){
  log.info("data models recieved");
  userTable=db.getuserdef;
  reviewTable=db.getreviewdef;
  pinTable=db.getpindef;
});
router.post('/sms',params({body:['phonenumber']},{message : config.get('error.badrequest')}),function(req,res){
  var pin=Math.floor(Math.random()*9000) + 1000;
  pinTable.update({phonenumber:req.body.phonenumber},{$set:{pin:pin}},{upsert:true},function(err,info){
    if(!err){
      log.debug(pin);
      res.json(config.get('ok'));
    }else{
      res.status(500).json(config.get('error.internalservererror'));
    }
  });
});
/* create users listing. */
router.post('/create',params({body:['email','name','phonenumber','pin']},{message : config.get('error.badrequest')}),function(req,res,next){
  pinTable.findOne({phonenumber:req.body.phonenumber,pin:req.body.pin},"_id",function(err,pin){
    log.debug("data",err,pin);
    if(!config.get("pinbypass")) {
      if (err || !pin) {
        res.status(401).json(config.get('error.unauthorized'));
      } else {
        next();
      }
    }else{
      next();
    }
  });
});
router.post('/create',params({body:['email','name','phonenumber','pin']},{message : config.get('error.badrequest')}), function(req, res,next) {
  userTable.findOneAndUpdate({phonenumber:req.body.phonenumber,is_verified:false},{name:req.body.name,email:req.body.email,is_verified:true},{upsert:true, 'new': true},function(err,user){
      if (!err) {
        req.user=user;
        next();
      } else {
        if(err.code=11000){
          userTable.findOne({phonenumber:req.body.phonenumber},"_id",function(err,user){
            req.user=user;
            next();
          });
        }else {
          res.status(500).json(config.get('error.dberror'));
          log.warn(err);
        }
      }
  });
});
router.post('/create',params({body:['email','name','phonenumber','pin']},{message : config.get('error.badrequest')}), function(req, res) {
  var expires = new Date(moment().add(25, 'days').valueOf()).toISOString();
  var data = crypto.encryptObject({
    user: {_id: req.user._id},
    exp: expires
  });
  var token = jwt.encode(data, config.get('jwtsecret'));
  res.json({
    result:"ok",
    token: token,
    secret_key:req.user._id,
    expires: expires
  });
});
router.post('/protected/contacts',function(req,res){
  log.info(req.body.contacts);
  userTable.update({_id:new ObjectId(req.user._id)},{$addToSet:{contacts:{$each:req.body.contacts}},$set:{modified_time:new Date()}},function(err,info){
    if(!err){
      res.json(config.get('ok'));
    }else{
      res.status(500).json(config.get('error.dberror'));
      log.warn(err);
    }
  });
});
router.post('/protected/notificationRegistration',params({body:['service','registrationId'],user:['_id']},{message : config.get('error.badrequest')}),function(req,res){
  userTable.update({_id:new ObjectId(req.user._id)},{$set:{device:{service:req.body.service,reg_id:req.body.registrationId,active:"true"},modified_time:new Date()}},function(err,info){
    if(!err){
      res.json(config.get('ok'));
    }else{
      res.status(500).json(config.get('error.dberror'));
      log.warn(err);
    }
  });
});
router.post('/protected/renew',params({body:['key'],user:['_id']},{message : config.get('error.badrequest')}),function(req,res){
  if(req.body.key.toString()===req.user._id.toString()) {
    var expires = new Date(moment().add(25, 'days').valueOf()).toISOString();
    var data = crypto.encryptObject({
      user: {_id: req.body.key},
      exp: expires
    });
    var token = jwt.encode(data, config.get('jwtsecret'));
    res.json({
      result:"ok",
      token: token,
      expires: expires
    });
  }else{
    res.status(401).json(config.get('error.unauthorized'));
  }
});
router.get('protected/details',params({user:['_id']},{message : config.get('error.badrequest')}),function(req,res){
  userTable.findOne({_id:new ObjectId(req.user._id)},"name phonenumber email",function(err,user){
    if(!err){
      res.json(user);
    }else{
      res.status(500).json(config.get('error.dberror'));
    }
  })
});
router.get('/protected/reviewed',params({user:['_id']},{message : config.get('error.badrequest')}),function(req,res){
  reviewTable.find({user_id:new ObjectId(req.user._id),is_deleted:false},"review rating").populate("complaint_user").exec(function(err,rows){
    if(!err) {
      req.user=req.user.toObject();
      delete req.user._id;
      res.json({result: "ok",user:req.user, reviews: rows});
    }else{
      res.status(500).json(config.get('error.dberror'));
    }
  });
});
router.get('/protected/reviews',params({user:['_id']},{message : config.get('error.badrequest')}),function(req,res){
  reviewTable.find({complaint_user:new ObjectId(req.user._id),is_deleted:false},"review rating").populate("complaint_user").exec(function(err,rows){
    if(!err) {
      req.user=req.user.toObject();
      delete req.user._id;
      res.json({result: "ok",user:req.user, reviews: rows});
    }else{
      res.status(500).json(config.get('error.dberror'));
    }
  });
});
router.post('/protected/change/profile',params({user:['_id','name','email']},{message : config.get('error.badrequest')}),function(req,res){
    if(!req.body.name){
      req.body.name=req.user.name;
    }
    if(!req.body.email){
      req.body.email=req.user.email;
    }
  userTable.update({_id:new ObjectId(req.user._id)},{$set:{name:req.body.name,email:req.body.email,modified_time:new Date()}},function(err,info){
    if(!err){
      res.json(config.get('ok'));
    }else{
      res.json(500).json(config.get('error.dberror'));
    }
  })
});


module.exports = router;
