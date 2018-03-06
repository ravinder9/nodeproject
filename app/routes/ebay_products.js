var User = require('../models/user');
var express = require('express');
var csv = require('csvtojson');
var async = require('async');
var ebay = require('ebay-api');
var ebayPromised = require('ebay-promised');
var env = require('../../env');
var ebaytrading = require('node-ebay-trading-api');
var router = express.Router();
import {
    isLoggedIn
} from '../commonFunctions'


router.get('/ebayProductrequest', isLoggedIn, function(req, res) {

    var params = {
        keywords: ["Canon", "Powershot"],

        // add additional fields
        outputSelector: ['AspectHistogram'],

        paginationInput: {
            entriesPerPage: 10
        },

        itemFilter: [
            { name: 'FreeShippingOnly', value: true },
            { name: 'MaxPrice', value: '150' }
        ],

        domainFilter: [
            { name: 'domainName', value: 'Digital_Cameras' }
        ]
    };

    ebay.xmlRequest({
            serviceName: 'Finding',
            opType: 'findItemsByKeywords',
            appId: 'sureshku-MyAccoun-PRD-65d705b3d-e04868c2', // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
            params: params,
            parser: ebay.parseResponseJson // (default)
        },
        // gets all the items together in a merged array
        function itemsCallback(error, itemsResponse, body) {
            //res.send(itemsResponse);



            if (error) throw error;

            var items = itemsResponse.searchResult.item;

            console.log('Found', items.length, 'items');

            for (var i = 0; i < items.length; i++) {
                console.log('- ' + items[i].title);
            }
        }
    );
});




router.get('/ebayProductrequest1', isLoggedIn, function(req, res) {



    ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetMyeBaySelling',
            appId: 'sureshku-MyAccoun-SBX-a5d705b3d-2f9b0150', // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI

            devId: '6d4943a5-8a75-4c55-8e22-f13291a137ce',
            certId: 'SBX-5d705b3df419-c28d-4c3f-88e3-6cbc',

            sandbox: true,
            authToken: 'AgAAAA**AQAAAA**aAAAAA**wkk6Wg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GnAZeBowydj6x9nY+seQ**82YEAA**AAMAAA**sPxUDGsaKXHDQbl5lxIYdc+x/Yz62rMxpHbFw3fPYVWMK6ZYU1AMhwJHXzDJg+wbkq5H+jj+MwUBYPdnS9Dw1u8jLHiSEMRxCLW8eDAukJTx0L5RlTGLZs9XOARrg6RELF7B7P5Gg1HWvPoXmdo/rsfGxKYK6rFDFWzCd0pnHuwoYKD2C5Eal854QmB+ocXjvOaUlO0pCEfySHoZnodn3T2nXVdixVumEoQaKXZgUqCv6xs91mz/YGeauzqSBoXdxU3+Dq3XmK5aBDs0v9kSfnlcc1eZ0xCDprKv+Yzoy+Dqt6I6Rwm8U5j9DakHLqGPHWSgwZhADJkf6vaP8LriUDMpwSc4Qs+dEhTq+jSHUP46GhoCChghrqyR7GPnjDAB0Xe5NDIHek3hk4e9f9I+AOt6QLEuQpbBKmIG+bfZgcTFpvzFNDh5nSmSysMVNtpB0mBMh3oQl67QkimBFSI/B7URm8U7G/S6dFje/BC9YRRqDXiMwmlBCGY22YpGuFXRXSHa8B7APuLZEndCr2mwV20nEN/U/MBSmsp5HKAXRRpZWz/5SVrTXY4tvVVi0E0vDb4OCKQ28OeLpun5EeCMNsHmcr9YIU/mkSsLS5zMlhJMpILO8crMaatj/a8W9ZJvKui3EwzqvwPCfjLtC1bDgvBSSxvcESLjgHvrOEjMpxns8dHKulA4w+xmqCwz/0ROH9JHevp7bHYB2WNKsrDIoxqgwzMb7SQQzXqgPL2LXHz3w4Qdo2Y1FK/Kz8r2uhQ3',
            // parser: ebay.parseRsponseJson // (default)e
        },
        // gets all the items together in a merged array
        function itemsCallback(error, itemsResponse) {
            res.send(body);



            // if (error) throw error;

            // var items = itemsResponse.searchResult.item;

            // console.log('Found', items.length, 'items');

            // for (var i = 0; i < items.length; i++) {
            //     console.log('- ' + items[i].title);
            // }
        }
    );
});



router.get('/ebayProductrequest2', isLoggedIn, function(req, res) {

    ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetItem',
            appId: 'sureshku-MyAccoun-SBX-a5d705b3d-2f9b0150',
            certId: 'SBX-5d705b3df419-c28d-4c3f-88e3-6cbc',
            devId: '6d4943a5-8a75-4c55-8e22-f13291a137ce',
            //sandbox: true,
            //authToken: 'v^1.1#i^1#f^0#p^3#r^0#I^3#t^H4sIAAAAAAAAAOVXa2wUVRTu9mUACz9EIGB0M7wEOrN3ZvY1Y3dx+0BW+9iyWwKogXncaYfOzqxz77TdGEtpSJX4R40FE0msPzCKMSZoIopEEzWYUDWihqJREhNNIWqCBInEVO/stmVbFfogsYn7Z/bee17fOd+5Mwf0lM9b37e570qF55bigR7QU+zxsAvAvPKyDQtLipeXFYECAc9Az6qe0t6S4SokpY2MuAWijGUi6O1KGyYSc5sRyrFN0ZKQjkRTSkMkYkVMxhrqRY4BYsa2sKVYBuWN10YoPuxnw1qQZ2UAWNmvkF1zzGbKilBCWJBVgeNZBQagrHLkHCEHxk2EJRNHKA6wIZrlaA6kgCByvMgGGIEP7aC8W6GNdMskIgygorlwxZyuXRDr9UOVEII2JkaoaDy2KdkUi9fWNaaqfAW2oqN5SGIJO2jiqsZSoXerZDjw+m5QTlpMOooCEaJ80byHiUbF2FgwMwg/l2pVkyUBAInlOOAnWb0pqdxk2WkJXz8Od0dXaS0nKkIT6zh7o4ySbMi7oYJHV43ERLzW6z6aHcnQNR3aEaquOra9JVm3hfImEwnb6tBVqLpIWZ4PCiGeI8FiiEgKob0TOTZEbYAd9ZU3OJrpSc5qLFPV3bwhb6OFqyEJHE5OD1uQHiLUZDbZMQ27QRXIsex4Gtkdbl3zhXRwm+mWFqZJLry55Y2LMMaKazy4WbwI+FUOKhwUVAVqajg8kRdur8+MG1G3PLFEwufGAmUpS6clux3ijCEpkFZIep00tHVV5AMax4c1SKtBQaP9gqbRckAN0qwGIYBQlhUh/D+jCMa2LjsYjtNk8kEOZ4RKKlYGJixDV7LUZJHczTNKii4Uodowzog+X2dnJ9PJM5bd6uPInevb1lCfVNpgWqLGZfUbC9N6jh4KJFpIF3E2Q6LpIuwjzs1WKsrbakKycbbayZJ1EhoGeYwxeEKE0cm7/wIVuVDnFkhXHxEDUkZnXIIzipX2WRJpaHdrZy5i71SEfLKTJf5VaDM2lFTLNLJT12t1CIHz2lNTQqQaTL4XCYwCj26vT9/ANJzqZgfhsmVnpwlzovI0dCRFsRwTz8TdqOo0NDTH0HTDcNt1Jg4L1KcTpikZWawraNzlrLoslsnE1bnVZflrud2hG7KxXE3oZPU2WgqoIRCQeZXmNEEGbADMCrcKO3QF7tTnGHbTMYxZ4aqFHf9cT9LrL/53uIKqX/DzUoAOS6EA7VcC5B/kOFpjeU5gJZYPKXBWuBta51opG32xWSGqMXRyM6Syc+0luNlCGKqzg0Y+R+cWKPeGGbtgND8r0AoXVglPeY0OhyFPBxVZmSrkSRsFn3R/+6D3TRyqo0W5H9vrOQF6PW+TuRyEAM1uAOvKS1pKS26lkI4hgyRTla0uRpc0BumtJpkZbci0w2xG0u3ics+DKy5s/KNgnB94GCwbH+jnlbALCqZ7cMe1kzJ20dIKNuSOi8CdwAM7wMprp6XsktLF3z5Xntnes7q+dfXICFf3wvG2M48dBRXjQh5PWVFpr6eIeaZ7xciug/X3Uif3nW2rsn/f/PUXFXUHjRP67Y2na7f+2l11/rcW5pi/f+GX3w2dMJ6/+sO6Iz+WLD/45PyRozXxVc92vbp/33BlU/N9r7zOLKo+fuGlNU89ErYewufe/+TQbe8NXT65ds/VwfDRSq6tqHv/WxeXZPasWZkJpsD87sP1v3y0ePjpMmVp8M/q0r5j2saXjaH0a+t3DeLLB8C7n190zOa+Q+c/rHojNaT+3HH67Noji1af/+zy6Y+XJa4cvvNUk/HBwJU3TwXfMVsHhz/tj1xq+f6IXfn43rPwm5LiBffvvWs/8FzEg33bU6lz9/z0VXN/ZeiAtpt7ANGP3t1Y/cSZnvZQiL2UL+Nfjxc1k2gRAAA=',

            params: {
                'ItemID': '110250138563' // FILL IN A REAL ItemID
            }
        },
        function(error, data) {
            if (error) {
                res.send(error);
            } else {
                res.send(data);
            }
        });

});





module.exports = router;