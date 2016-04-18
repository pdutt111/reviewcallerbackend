var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
var async= require('async');
var db=require('../db/DbSchema');
var events = require('../events');
var norepeat = require('array-norepeat');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var userTable;
var reviewTable;
events.emitter.on("db_data",function(){
  log.info("data models recieved");
  userTable=db.getuserdef;
  reviewTable=db.getreviewdef;
});

router.get('/protected/review',params({query:['phonenumber'],user:['_id','name','phonenumber']},{message : config.get('error.badrequest')}),function(req,res){
    //req.query.phonenumber=req.query.phonenumber.replace("+91","");
  userTable.findOne({'phonenumber':req.query.phonenumber},"name email phonenumber profession address url loc").exec(function(err,user) {
      log.info(err,user);
      if(user) {
          reviewTable.find({
              'complaint_user': new ObjectId(user._id),
              is_deleted: false
          }, "review rating created_time user_id complaint_user").sort({'created_time': -1}).populate("user_id",'name phonenumber -_id').limit(100).exec(function (err, rows) {
              var result = {};
              result.result="ok";
              log.debug(this.user);
              result.user = this.user.toObject();
              delete result.user._id;
              result.reviews = rows;
              res.json(result);
          }.bind({user: user}));
      }else{
          if(err) {
              res.status(500).json(config.get('error.internalservererror'));
          }else{
              res.json({result:"not found"});
          }
      }
  });
})
    .post('/protected/review',params({body:['phonenumber','name','review','rating','profession','email']},{message : config.get('error.badrequest')}),function(req,res,next){
        log.info(req.body);
        //req.body.phonenumber=req.body.phonenumber.replace("+91","");
        userTable.findOne({phonenumber:req.body.phonenumber},"_id",function(err,user) {
            if(!user){
                var user=JSON.parse(JSON.stringify(req.body));
                log.info(user);
                if(!user.email||user.email==""){
                    delete user.email
                }
                if(!user.profession||user.profession==""){
                    delete user.profession;
                }
                if(!user.name||user.name==""){
                    delete user.name;
                }
                var user=new userTable(user);
                user.save(function(err,doc){
                    if(!err) {
                        req.complaint_user = doc;
                        next();
                    }else{
                        log.error(err);
                        res.status(500).json(config.get('error.dberror'));
                    }
                });
            }else{
                log.info(user,req.body);
                if(!user.email||user.email==""){
                    user.email=req.body.email;
                }
                if(!user.profession||user.profession==""){
                    user.profession=req.body.profession;
                }
                if(!user.name||user.name==""){
                    user.name=req.body.name;
                }
                user.save(function(err,user){});
                req.complaint_user=user;
                next();
            }
        });
        })
    .post('/protected/review',params({body:['phonenumber','name','review','rating','profession','email']},{message : config.get('error.badrequest')}),function(req,res){
          var review = new reviewTable({complaint_user:req.complaint_user._id,user_id:req.user._id,review:req.body.review,rating:req.body.rating});
          review.save(function (err, review) {
            if (!err) {
              res.json(config.get('ok'));
            }else{
                log.error(err);
                res.status(500).json(config.get('error.dberror'));
            }
          });
    })
    .delete('/protected/review',params({body:['review_id']},{message : config.get('error.badrequest')}),function(req,res){
      reviewTable.update({user_id:req.user._id,_id:req.body.review_id},{$set:{is_deleted:true,modified_time:new Date()}},function(err,info){
          log.info(err,info);
        if(!err&&info.nModified>0) {
          res.json(config.get('ok'));
        }else{
            log.error(err);
          res.status(500).json(config.get('error.internalservererror'));
        }
      })
    });
router.get('/protected/search',params({query:['q','lat','lon']},{message : config.get('error.badrequest')}),function(req,res,next){

    async.parallel([
            function(callback){
                var re = new RegExp("" + req.query.q + "", 'i');
                userTable.find({$or: [{name: {$regex: re}}, {profession: {$regex: re}},{phonenumber:{$regex:re}}], loc:{$near: {
                    $geometry: {
                        type: "Point" ,
                        coordinates: [ req.query.lon , req.query.lat ]
                    },
                    $maxDistance: 10000,
                    $minDistance: 1
                }}}, "name phonenumber profession address url").limit(100).exec( function (err, rows) {
                        callback(err,rows);
                });
            },
            function(callback){
                var re = new RegExp("" + req.query.q + "", 'i');
                userTable.find({$or: [{name: {$regex: re}}, {profession: {$regex: re}},{phonenumber:{$regex:re}}]}, "name phonenumber profession address url").limit(100).exec( function (err, rows) {
                  callback(err,rows);
                });
            }
        ],
// optional callback
        function(err, results){
            if(!err){
                var response=results[0];
                    response=results[0].concat(results[1])
                res.json(norepeat(response,false));
            }else{
                log.error(err);
                res.status(500).json(config.get('error.dberror'));
            }
        });
});
router.get('/protected/search',params({query:['q','lat','lon']},{message : config.get('error.badrequest')}),function(req,res){

});


module.exports = router;
