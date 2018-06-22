const express = require('express');
const request = require('request');
const cors    = require('cors');
const app     = express();

const port = 3000;

app.use(cors());

app.get('/people',
    getRequestData,
    jsonResponse
);

app.get('/planets',
    getRequestData,
    jsonResponse
);

const sortByArray = ['name', 'height', 'mass'];

const queryParam = '';

const resultsToShow = [];

const url = '';

const continueLooping = false;

function getRequestData(req, res, next) {

    if (req.url === '/people') {
        url = `https://swapi.co/api/people/`;
    } else if (req.url === '/planets') {
        url = `https://swapi.co/api/planets/`;
    } else {
        res.locals = {
            success: false,
            results: "Invalid Request URL."
        };
        jsonResponse(res);
    }

    if (req.query.sortBy) {
        queryParam = req.query.sortBy
    }

    next();
}

function handleSwapiData(req, res, next) {

    function getSwapiData() {
        return new Promise((resolve, reject) => {
            request(url, function(err, res, body){
            // request("https://swapi.co/api/people/?page=9", function(err, res, body){

                if (err || body[0] === '<') {
                    res.locals = {
                        success: false,
                        error: err || 'Invalid request.'
                    };
                    jsonResponse(res);
                }

                for (const value of JSON.parse(body).results) {
                    resultsToShow.push(value);
                }

                const next_url = JSON.parse(body).next;
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

    const data = getSwapiData()
    data.then(function(res) {
        if (continueLooping) {
            getSwapiData();
        } else {
            console.log("resultsToShow length:");
            console.log(resultsToShow.length);

            console.log("done looping");

            next();
        }
    })
    .catch((error) => {
        res.locals = {
            success: false,
            error: error || 'Promise error'
        };
        jsonResponse(res);
    });
}

function handleApiResponse(req, res, next) {

    if (sortByArray.includes(queryParam)) {

        function compareNames(a, b) {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
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
