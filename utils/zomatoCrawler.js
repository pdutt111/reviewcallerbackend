/**
 * Created by pariskshitdutt on 01/08/15.
 */
var request=require('request');
var fs = require('fs');
var parser = require('xml2json');
var options = {
    object: false,
    reversible: false,
    coerce: true,
    sanitize: true,
    trim: true,
    arrayNotation: false
};

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/scathe';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    console.log("connected");
    for (var i = 250000; i < 313519; i++) {            //313519
    try {
        crawl(i, db);
    }catch(err){
        console.log(err);
    }
    }

});
function crawl(i,db){
    request({
        gzip: true,
        uri: 'http://1api.zomato.com/v2/restaurant.xml/' + i,
        method: 'GET',
        headers: {'X-Zomato-API-Key': '7749b19667964b87a3efc739e254ada2'}
    }, function (error, response, body) {
        if (!error) {
            try {
                console.log("hit");
                var json = parser.toJson(body, options);
                var collection = db.collection('practo');
                collection.insert([JSON.parse(json)], function (err, result) {
                    console.log(err);
                });
            }catch(e){
                console.log(e);
            }
        } else {
            console.log(error);
        }
    });
}