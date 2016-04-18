/**
 * Created by pariskshitdutt on 06/08/15.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var db=require('../db/DbSchema');
var events = require('../events');
var config= require('config');
var ObjectId = require('mongoose').Types.ObjectId;
var log = require('tracer').colorConsole(config.get('log'));

var userTable;
var reviewTable;
events.emitter.on("db_data",function(){
    //log.info("data models recieved");
    userTable=db.getuserdef;
    reviewTable=db.getreviewdef;
});

// Connection URL
var url = 'mongodb://localhost:27017/scathe';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    console.log("Connected correctly to server");
    var collectionZomato = db.collection('zomato');
    collectionZomato.find({},['restaurant.name','restaurant.url','restaurant.phone','restaurant.location.address','restaurant.location.latitude',
        'restaurant.location.longitude','restaurant.user_rating.aggregate_rating','restaurant.user_rating.votes'
        ,'restaurant.reviews.review.rating','restaurant.reviews.review.review_text',
        'restaurant.reviews.review.review_time',
        'restaurant.reviews.review.user.name']).each(function(err, docs) {
        try {
            var a=docs.restaurant;
            try {
                var phone = a.phone.split(",")[0];
            }catch(e){}

        var user=new userTable({name: a.name,phonenumber: phone,is_verified:true,profession:"restaurant",
            url: a.url,loc:[a.location.longitude, a.location.latitude],address: a.location.address,is_service:true});
        user.save(function(err,doc){
            if(!err&&doc) {
                var reviews = this.reviews;
                try {
                    console.log(reviews.length);
                        for (var i=0;i<reviews.length;i++) {
                            var review = new reviewTable({
                                complaint_user: new ObjectId(doc._id),
                                name: reviews[i].user.name,
                                created_time: new Date(reviews[i].review_time),
                                review: reviews[i].review_text,
                                rating: reviews[i].rating
                            });
                            review.save(function (err, review) {
                            })
                        }
                }catch(e){
                    console.log(e);
                }
            }
        }.bind({reviews: a.reviews.review}));
        }catch(e){
            console.log(e);
        }
        //db.close();
    });
});