/**
 * Created by pariskshitdutt on 09/06/15.
 */
var mongoose = require('mongoose');
var config = require('config');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var ObjectId = require('mongoose').Types.ObjectId;
var validate = require('mongoose-validator');

var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'Name should be between 3 and 50 characters'
    })
];
var emailValidator=[
    validate({
        validator: 'isEmail',
        message: "not a valid email"
    })
]

mongoose.connect(config.get('mongo.location'));
var db = mongoose.connection;
var userdef;
var reviewdef;
var pindef;
var Schema = mongoose.Schema;
mongoose.set('debug', config.get('mongo.debug'));
/**
 * user schema stores the user data the password is hashed
 * @type {Schema}
 */
var userSchema=new Schema({
    email:{type:String,validate:emailValidator},
    phonenumber:{type:String,unique: true ,dropDups:true},
    name:{type:String},
    is_verified:{type:Boolean,default:false},
    device:{service:String,reg_id:String,active:{type:Boolean,default:true}},
    contacts:[{phonenumber:{type:String},name:String,_id:false}],
    profession:{type:String},
    url:{type:String},
    address:{type:String},
    loc:{type:[Number], index:"2dsphere"},
    is_service:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});

var reviewschema=new Schema({
    user_id:{type:Schema.ObjectId,ref:'user'},
    complaint_user:{type:Schema.ObjectId,ref:'user'},
    anonymous:Boolean,
    review:String,
    name:String,
    rating:Number,
    is_deleted:{type:Boolean, default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var pinschema=new Schema({
    phonenumber:{type:String},
    pin:Number
})
db.on('error', function(err){
    log.info(err);
});
/**
 * once the connection is opened then the definitions of tables are exported and an event is raised
 * which is recieved in other files which read the definitions only when the event is received
 */
db.once('open', function () {
    log.info("connected");
    userdef=mongoose.model('user',userSchema);
    reviewdef=mongoose.model('reviews',reviewschema);
    pindef=mongoose.model('pins',pinschema);
    userdef.on('index', function(err) {
        if (err) {
            log.error('User index error: %s', err);
        } else {
            log.info('User indexing complete');
        }
    });
    reviewdef.on('index',function(err) {
        if (err) {
            log.error('restaurant index error: %s', err);
        } else {
            log.info('restaurant indexing complete');
        }
    });

    exports.getpindef=pindef;
    exports.getreviewdef= reviewdef;
    exports.getuserdef= userdef;
    events.emitter.emit("db_data");
});

