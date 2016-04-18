/**
 * Created by pariskshitdutt on 16/07/15.
 */

    /**
     * Created by pariskshitdutt on 16/07/15.
     */
    var request=require('request');
var LineByLineReader = require('line-by-line');
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/lawyers';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    var lr = new LineByLineReader('docids.txt');
    lr.on('error', function (err) {
        // 'err' contains error object
        console.log(err);
    });

    lr.on('line', function (line) {
    console.log(line);
    request('http://win.justdial.com/10feb2015/searchziva.php?city=Delhi&state=&case=detail&stype=category_list&wap=1&max=50&search=Lawyers%20&docid='+line+'&area=Delhi&pg_no=1&native=1&version=4.3&rnd1=0.2', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body=JSON.parse(body);
            console.log(body) // Show the HTML for the Google homepage.
            var collection = db.collection('data');
            collection.insert([body.results], function(err, result) {});
        }
    });
});

});