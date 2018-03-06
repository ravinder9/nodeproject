import async from "async";
var ebay = require('ebay-api');
var ebayPromised = require('ebay-promised');
//var env = require('../../env');
var ebaytrading = require('node-ebay-trading-api');
export function getebayProducts(userid,productdetail ,callback) {
     let regions = productdetail[0].region;
     //console.log(regions);
//console.log(productdetail);
let clientid = productdetail[0].clientid;
let devid = productdetail[0].devid;
let clientsecret = productdetail[0].clientsecret;
let token = productdetail[0].token;
var test=[];
 var alldata=[];
async.each(regions,function(region, done) { 
    ///getMarkerPlaceSiteid(region);
   // console.log(region);
   
ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetMyeBaySelling',
            appId: clientid, // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI

            devId: devid,
            certId: clientsecret,

            sandbox: true,
           siteid:region,
         authToken: token,
          params: {
    ActiveList:true
}

        },
        function(error, data) {
            if (error) {
                console.log(error);
            } else {

                console.log("data is :"+data);
                //callback(null,data);
                alldata.push({'data':data,'siteid':region});
                done();
            }
        });

},
        function(err, result) {
           callback(null,alldata);
            /*if (err) console.error(err.message);
            callback(null);*/
        });

    /*ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetMyeBaySelling',
            appId: clientid, // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI

            devId: devid,
            certId: clientsecret,

            sandbox: true,
           
         authToken: token,
          params: {
    ActiveList:true
}

        },
        function(error, data) {
            if (error) {
                console.log(error);
            } else {

                console.log("data is :"+data);
                callback(null,data);
            }
        });*/
       
}

function getMarkerPlaceSiteid(region, cb) {
    switch (region) {//
        case "AU":
            cb("15");
            break;
        case "AT":
            cb("16");
            break;
        case "BENL":
            cb("123");
            break;
        case "BEFR":
            cb("23");
            break;
            case "CA":
            cb("2");
            break;
        case "CAFR":
            cb("210");
            break;
        case "FR":
            cb("71");
            break;
            case "DE":
            cb("77");
            break;
            case "HK":
            cb("201");
            break;
            case "IN":
            cb("203");
            break;
            case "IE":
            cb("205");
            break;
            case "IT":
            cb("101");
            break;
            case "MY":
            cb("207");
            break;
            case "Nl":
            cb("146");
            break;
            case "PH":
            cb("211");
            break;
            case "PL":
            cb("212");
            break;
            case "RU":
            cb("215");
            break;
            case "SG":
            cb("216");
            break;
            case "ES":
            cb("186");
            break;
            case "CH":
            cb("193");
            break;
            case "UK":
            cb("3");
            break;
            case "US":
            cb("0");
            break;


        case "default":
            cb(null);
    }
    //console.log('region is======>' + region);
}
