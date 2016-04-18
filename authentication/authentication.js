/**
 * Created by pariskshitdutt on 24/07/15.
 */
var crypto=require('../authentication/crypto');
var jwt = require('jwt-simple');
var config= require('config');
var log = require('tracer').colorConsole(config.get('log'));


var auth=function(req,res,next){
    if(req.originalUrl.indexOf("/protected/")>-1) {
        if(req.headers.authorization){
            var token=req.headers.authorization;
                try {
                    var decoded = crypto.decryptObject(jwt.decode(token, config.get('jwtsecret')));
                    var now = (new Date()).toISOString();
                    if ((now < decoded.exp)) {
                        req.user=decoded.user;
                        next();
                    }else{
                        if(req.originalUrl.indexOf("/protected/renew")>-1){
                            req.user=decoded.user;
                            next();
                        }
                        else {
                            res.status(401).json(config.get('error.webtoken.expired'));
                        }
                    }
                } catch (err) {
                    log.error(err,req);
                    res.status(401).json(config.get('error.webtoken.unknown'));
                }
        } else {
            res.status(401).json(config.get('error.webtoken.notprovided'));
        }
    }else{
        next();
    }
};

module.exports=auth;