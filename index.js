/*
    @description: Encargado de orquestar los servicios de Dollar y News
    @port: 3000
*/
var SERVICE_PORT = 3000;
var SERVICE_NEWS_URL = "http://localhost:3002";
var SERVICE_DOLLAR_URL = "http://localhost:3001";
var redis = require('redis');
var express = require('express');
var axios = require('axios');
var moment = require('moment');
var morgan = require('morgan')
var app = express();
    app .use(morgan('combined'))
let Parser = require('rss-parser');
let parser = new Parser();

// Connect Redis
var client;
try {
    client = redis.createClient();
    console.log("Redis client connected succesfully.")
} catch (e) {
    console.log("Error trying to connect with Redis. Trying again in 3 seconds.")
    setTimeout(createClient, 3000);
};

/*
    @response: JSON
    @body:
    dollar: {
        sell: 600,
        buy: 630
    },
    news: [{
        title: "Title",
        body: "Body",
        date: "2020-01-21"
    }]

*/    
app.get('/', async function (req, res) {
    var date = moment().unix();
    var dollar_news_key_for_redis = 'dollar-news-orchester:' + date;
    client.get(dollar_news_key_for_redis, async function (error, result) {
        if (error) {
            res.send({
                success: true,
                msg: "ERROR",
                data: []
            });
        } else {
            if(!result) {

                const requestNews = axios.get(SERVICE_NEWS_URL + "/dollar/news");
                const requestDollar = axios.get(SERVICE_DOLLAR_URL + "/dollar");

                axios.all([requestNews, requestDollar]).then(axios.spread((...responses) => {
                    const responseOne = responses[0];
                    const responseTwo = responses[1];
                    var data_to_send = {
                        dollar: responseTwo.data.data.dollar,
                        news: responseOne.data.data
                    };
                    
                    client.set(dollar_news_key_for_redis, JSON.stringify(data_to_send));
                    console.log("Storing dollar news for getting this information from cache");

                    res.send({
                        success: true,
                        msg: "SUCCESS",
                        data: data_to_send
                    });

                // use/access the results 
                })).catch(errors => {
                    res.send({
                        success: false,
                        msg: "ERROR",
                        data: []
                    });
                });
            } else {
                // We send the information as jSON
                res.send({
                    success: true,
                    msg: "SUCCESS",
                    data: JSON.parse(result) 
                });
            }
        }
    });

});

// Service UP
app.listen(SERVICE_PORT, function () {
    console.log('Ufro: Service DollarNews on port ' + SERVICE_PORT);
});
module.exports = app;