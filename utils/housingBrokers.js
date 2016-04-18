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
    for (var i = 0; i < 39087; i++) {            //313519
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
        uri: 'https://api.housing.com/api/v3/brokers/' + i,
        method: 'GET'
    }, function (error, response, body) {
        if (!error) {
            try {
                console.log("hit");
                //var json = parser.toJson(body, options);
                var collection = db.collection('housing');
                collection.insert([JSON.parse(body)], function (err, result) {
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