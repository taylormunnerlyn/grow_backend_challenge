const express = require('express');
const request = require('request-promise');
var Promise   = require('promise');
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

const sortByArray = ['name', 'height', 'mass'];
var swapiData = [];
var url = '';
var continueLooping = false;
var doneLooping = false;

function getRequestData(req, res, next) {

    if (req.query.sortBy) {
        var queryParam = req.query.sortBy
    }

    function getSwapiData() {
        return new Promise((resolve, reject) => {
            request(url, function(err, res, body){

                if (err || body[0] === '<') {
                    res.locals = {
                        success: false,
                        error: err || 'Invalid request.'
                    };
                    return next();
                }

                for (var value of JSON.parse(body).results) {
                    swapiData.push(value);
                }

                if (JSON.parse(body).next) {
                    url = JSON.parse(body).next;
                    continueLooping = true;
                } else {
                    url = "";
                    continueLooping = false;
                    doneLooping = true;
                }

                resolve("SUCCESS");

            });
        });
    }

    if (req._parsedUrl.pathname === '/people') {
        url = `https://swapi.co/api/people/`;

        function peopleLooper(){
            getSwapiData().then(function() {

                if (continueLooping) {
                    peopleLooper();
                }

                if (doneLooping) {

                    if (queryParam && sortByArray.includes(queryParam)) {
                
                        function compareNames(a, b) {
                            var nameA = a.name.toUpperCase();
                            var nameB = b.name.toUpperCase();
                            if (nameA < nameB) {
                                return -1;
                            }
                            if (nameA > nameB) {
                                return 1;
                            }
                
                            return 0;
                        };
                
                        function compareHeight(a, b) {
                            return a.height - b.height;
                        };
                
                        function compareMass(a, b) {
                            return a.mass - b.mass;
                        };
                
                        if (queryParam === 'name') {
                            swapiData.sort(compareNames);
                        } else if (queryParam === 'height') {
                            swapiData.sort(compareHeight);
                        } else {
                            swapiData.sort(compareMass);
                        }
                    }
        
        
                    res.locals = {
                        success: true,
                        results: swapiData
                    };
        
                    swapiData = [];
                    url = '';
                    continueLooping = false;
                    doneLooping = false;

                    return next();
                }
            })
            .catch((error) => {
                res.locals = {
                    success: false,
                    error: error || 'Invalid request.'
                };
                return next();
            });
        }
        peopleLooper();

    } else if (req._parsedUrl.pathname === '/planets') {
        url = `https://swapi.co/api/planets/`;

        async function getResidentData(residentUrl) {

            try {
                var data = await request(residentUrl);
            } catch(error) {
                res.locals = {
                    success: false,
                    error: error || 'Invalid request.'
                };
                return next();
            }

            return data;

        }

        async function residentLooper(planetIndex) {
            for (var [residentIndex, thisResident] of swapiData[planetIndex].residents.entries()) {

                try {
                    var data = await getResidentData(thisResident)
                } catch(error) {
                    res.locals = {
                        success: false,
                        error: error || 'Invalid request.'
                    };
                    return next();
                }

                swapiData[planetIndex].residents[residentIndex] = JSON.parse(data).name

            }
        }

        async function planetLooper() {
            for (var [planetIndex, thisPlanet] of swapiData.entries()) {

                if (thisPlanet.residents.length > 0) {

                    try {
                        await residentLooper(planetIndex);
                    } catch(error) {
                        res.locals = {
                            success: false,
                            error: error || 'Invalid request.'
                        };
                        return next();   
                    }

                    return new Promise((resolve, reject) => {resolve('success');});

                }
            } 
        }

        function handlePlanetData(){
            getSwapiData().then(function() {
                if (continueLooping) {
                    handlePlanetData();
                }

                if (doneLooping) {
                    planetLooper().then(function() {

                        res.locals = {
                            success: true,
                            results: swapiData
                        };
            
                        swapiData = [];
                        url = '';
                        continueLooping = false;
                        doneLooping = false;

                        return next();

                    })
                    .catch((error) => {
                        res.locals = {
                            success: false,
                            error: error
                        };
                        return next();
                    });
                }
            })
            .catch((error) => {
                res.locals = {
                    success: false,
                    error: error || 'Invalid request.'
                };
                return next();
            });
        }
        handlePlanetData();

    } else {
        res.locals = {
            success: false,
            error: new Error("Invalid request.")
        };
        return next();
    }
}

function jsonResponse(req, res, next) {
    return res.json(res.locals);
  }

app.listen(port, function () {
    console.log("Server is running on "+ port +" port");
});
