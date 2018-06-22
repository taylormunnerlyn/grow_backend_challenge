const express = require('express');
const request = require('request');
const cors    = require('cors');
const app     = express();

const port = 3000;

app.get('/people',
    getRequestData,
    jsonResponse
);

app.get('/planets',
    getRequestData,
    jsonResponse
);

var sortByArray = ['name', 'height', 'mass'];

var queryParam = '';

var resultsToShow = [];

var url = '';

var continueLooping = false;

var origRes = '';

function getSwapiData() {
    return new Promise((resolve, reject) => {
        request(url, function(err, res, body){
        // request("https://swapi.co/api/people/?page=9", function(err, res, body){
            // console.log(JSON.parse(body));

            if (err || body[0] === '<') {
                res.locals = {
                    success: false,
                    error: err || 'Invalid request.'
                };
                jsonResponse(res);
            }

            for (var value of JSON.parse(body).results) {
                // console.log(value);
                resultsToShow.push(value);
              }
            // resultsToShow.push(JSON.parse(body).results);
            var next_url = JSON.parse(body).next;
            console.log("next_url:");
            console.log(next_url);
            if (next_url) {
                console.log("keep going");
                url = next_url;
                continueLooping = true;
            } else {
                console.log("stop");
                url = "";
                continueLooping = false;
            }
            console.log("continue looping?");
            console.log(continueLooping);
            resolve("SUCCESS");
        });
    });
}

function looper(res) {
    this_res = res;
    const data = getSwapiData();
    data.then(function(res) {
        if (continueLooping) {
            looper(this_res);
        } else {
            // console.log("resultsToShow:");
            // console.log(resultsToShow);

            console.log("resultsToShow length:");
            console.log(resultsToShow.length);

            console.log("done looping");

            handleApiResponse(this_res);
        }
    })
    .catch((error) => {
        console.log(error, 'error');
        // res.locals = {
        //     success: false,
        //     error: error || 'Promise error'
        // };
        // jsonResponse(res);
    });
}

function getRequestData(req, res) {

    if (req.url === '/people') {
        url = `https://swapi.co/api/people/`;
    } else if (req.url === '/planets') {
        url = `https://swapi.co/api/planets/`;
    } else {
        return "Invalid Request URL.";
    }

    if (req.query.sortBy) {
        queryParam = req.query.sortBy
    }

    looper(res);
}

function handleApiResponse(res) {

    if (sortByArray.includes(queryParam)) {

        function compareNames(a, b) {
            var nameA = a.name.toUpperCase(); // ignore upper and lowercase
            var nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        };

        function compareHeight(a, b) {
            return a.height - b.height;
        };

        function compareMass(a, b) {
            return a.mass - b.mass;
        };

        if (queryParam === 'name') {
            resultsToShow.sort(compareNames);
        } else if (queryParam === 'height') {
            resultsToShow.sort(compareHeight);
        } else {
            resultsToShow.sort(compareMass);
        }
    }
    res.locals = {
        success: true,
        results: resultsToShow
    };
    jsonResponse(res);
}

function jsonResponse(res) {
    return res.json(res.locals);
}

app.listen(port, function () {
    console.log("Server is running on "+ port +" port");
});
