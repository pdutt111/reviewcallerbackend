/**
 * Created by pariskshitdutt on 16/07/15.
 */
var request=require('request');
var fs = require('fs');
var file=fs.createWriteStream("docids.txt");
file.on('open', function(fd) {
    for (var i = 0; i < 200; i++) {
        request('http://win.justdial.com/10feb2015/searchziva.php?city=Delhi&state=&case=spcall&stype=category_list&wap=1&max=50&search=Lawyers%20&area=Delhi&pg_no=' + i + '&native=2&version=4.3&rnd1=0.2', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body=JSON.parse(body);
                console.log(body) // Show the HTML for the Google homepage.
                if (body.results.length > 0) {
                    for(var j=0;j<body.results.length;j++){
                        console.log(body.results[j].docId);
                        file.write(body.results[j].docId+"\n");
                    }
                }
            }
        });
    }
});