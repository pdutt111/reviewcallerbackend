/**
 * Created by pariskshitdutt on 25/07/15.
 */
var config= require('config');
var log = require('tracer').colorConsole(config.get('log'));
var db=require('../db/DbSchema');
var events = require('../events');

var userTable;
var reviewTable;
events.emitter.on("db_data",function(){
    log.info("data models recieved");
    userTable=db.getuserdef;
    reviewTable=db.getreviewdef;
});

var details=function(req,res,next){
    if(req.originalUrl.indexOf("/protected/")>-1) {
        userTable.findOne({_id: req.user._id}, "name email phonenumber", function (err, user) {
            if (!err&&user) {
                req.user = user;
                next();
            }else{
                res.status(401).json(config.get('error.unauthorized'));
            }
        });
    }else{
        next();
    }
}

module.exports=details;