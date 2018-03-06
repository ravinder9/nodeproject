import async from "async"; 
export function getProducts(userid, userkeys, callback) {
    let regions = userkeys[0].region;
console.log(regions);
    //console.log('regions is ====>' + userid);
    async.forEachOf(
        regions,
        function(marketplaceId, region, done) {
            //console.log(done);

           getMarkerPlaceUrl(region, url => {


                requestReport(url, marketplaceId, userkeys, (err, requestid) => {
                  //console.log(requestid);
                   //console.log('marketplace: '+requestid.marketplace);
                    if (err) {
                        console.log(err);
                        done(err);
                    } else {

                        async.retry({ times: 50, interval: 2000 }, function(back) {
                            getRequestIdDetail(url, requestid, userkeys, (errstatus, generatedId) => {
                                console.log(errstatus, generatedId)
                                if (errstatus) {
                                    back(errstatus);
                                } else {
                                    back(null, generatedId)
                                }
                            });
                        }, function(err, generateReportId) {
                           // console.log('GeneratedId = >', generateReportId)
                            getAmazonProducts(url, userid, userkeys, generateReportId, (err, product) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log('final reponse:'+product) ;
                                    done();
                                }
                            })
                        });
                    }
                });
            });
        },
        function(err, result) {
            if (err) console.error(err.message);
            callback(null);
        }
    );
}

function getMarkerPlaceUrl(region, cb) {
    switch (region) {//
        case "IN":
            cb("mws.amazonservices.in");
            break;
        case "NA":
            cb("mws.amazonservices.com");
            break;
        case "BR":
            cb("mws.amazonservices.com");
            break;
        case "EU":
            cb("mws-eu.amazonservices.com");
            break;
        case "FE":
            cb("mws.amazonservices.com");
            break;
        case "CN":
            cb("mws.amazonservices.com.cn");
            break;
        case "default":
            cb(null);
    }
    //console.log('region is======>' + region);
}

function requestReport(url, marketplaceIds, userkeys, done) {
    let sellerID = userkeys[0].sellerid;
    let secretKey = userkeys[0].secretkey;
    let accesskey = userkeys[0].awsaccesskeyid;
   
var totalRequestId=[];
var i = 0 ;
    var length=marketplaceIds.length;
    //console.log(length);
async.eachSeries(marketplaceIds, function (marketplace, next) {

    var mws = require("amazon-mws-node")({
        AmzSecretKey: secretKey,
        AWSAccessKeyId: accesskey
    });

    let params = {
        Action: "RequestReport",
        ReportType: "_GET_MERCHANT_LISTINGS_ALL_DATA_",
        SellerId: sellerID,
        MarketplaceId: marketplace
    };
     //console.log(params);
 mws({
        method: "POST",
        base: url,
        endpoint: "/Reports/2009-01-01",
        params: params,
        callback: function(error, response, body) {
            var parseString = require("xml2js").parseString;
            parseString(body, function(err, results) {
                //console.log(results);
                var amzRequestId =
                    results.RequestReportResponse.RequestReportResult[0]
                    .ReportRequestInfo[0].ReportRequestId[0];
                if (response.statusCode == 403) {

                    totalRequestId.push("5");
                   
                    i++ ;
                     next();
                } else {
                  
                     totalRequestId.push({'requestid':amzRequestId,'marketplace':marketplace});
                    
                    
                    i++ ;
                    next();    

                }
            });
        }
    });

     
     
 
},function(err,data){

console.log('complete for all marketplace') ;
  console.log(totalRequestId);
  done(null ,totalRequestId );
  

})
   

    
}

function getRequestIdDetail(url, ReportRequestId, userkeys, cb) {
    //console.log(ReportRequestId);
    /*var t=ReportRequestId[1].requestid;
    console.log('mmm'+t);*/
    let sellerID = userkeys[0].sellerid;
    let secretKey = userkeys[0].secretkey;
    let accesskey = userkeys[0].awsaccesskeyid;
var totalGenerateId=[];

var i = 0 ;
    var length=ReportRequestId.length;

   // console.log('llllll:'+length);
   //console.log(length);
//async.eachSeries(ReportRequestId, function (requestid, next) {
function asyncLoop(i,callback)
{
if(i < length)
{
    //console.log(length);
var requestid=ReportRequestId[i].requestid;
var marketplace=ReportRequestId[i].marketplace;


    var mws = require("amazon-mws-node")({
        AmzSecretKey: secretKey,
        AWSAccessKeyId: accesskey
    });

    let params = {
        'Action': 'GetReportRequestList',
        'ReportProcessingStatusList.Status.1': '_DONE_',
        'ReportRequestIdList.Id.1': requestid,
        'SellerId': sellerID
    };
//console.log(params);
    mws({
        method: "POST",
        base: url,
        endpoint: "/Reports/2009-01-01",
        params: params,
        callback: function(error, response, body) {
            var parseString = require("xml2js").parseString;
            parseString(body, function(err, results) {
                if (results.ErrorResponse) {
                    //cb('error');
                } else {
                    
                    let ReportStatus = results.GetReportRequestListResponse.GetReportRequestListResult[0].ReportRequestInfo[0].ReportProcessingStatus;
                   console.log(ReportStatus);
                    if (ReportStatus == "_DONE_") {
                        console.log('done')
                        let ReportGeneratedId = results.GetReportRequestListResponse.GetReportRequestListResult[0].ReportRequestInfo[0].GeneratedReportId[0];
                          //console.log('aaaa:'+ReportGeneratedId);
                        totalGenerateId.push({'generateid':ReportGeneratedId,'marketplace':marketplace});
                        asyncLoop(i+1,callback);
                      
                       //cb(null, totalGenerateId)
                    } else {
               console.log('else');
                        setTimeout(function(){ 

                            asyncLoop(i,callback);
                        }, 3000);
                  
                        //next() ;
                        //cb(ReportStatus)
                    }
                }
            });
        }
    });
}
else
{
    callback() ;
}
}
asyncLoop(0,function(){
   console.log('totalGenerateId')
cb(null, totalGenerateId)
});
   // }
}

function getAmazonProducts(url, user_id, userkeys, reportid, done) {
   // console.log(reportid);
    var i = 0 ;
    var insert_response = [] ;


async.eachSeries(reportid, function (singlereportid, next) {
   // console.log(genrateid.generateid);

    var genrateid = singlereportid.generateid;
    //console.log(genrateid);
    var marketplace = singlereportid.marketplace ;
    var Products = require('../../models/products');

    let sellerID = userkeys[0].sellerid;
    let secretKey = userkeys[0].secretkey;
    let accesskey = userkeys[0].awsaccesskeyid;

    var mws = require('amazon-mws-node')({
        AmzSecretKey: secretKey,
        AWSAccessKeyId: accesskey
    });
let params={
            'Action': 'GetReport',
            'ReportId': genrateid,
            'SellerId': sellerID,
        };
       // console.log(params);
    mws({
        method: 'POST',
        base: url,
        endpoint: '/Reports/2009-01-01',
        params: params,

        callback: function(error, response, body) {

            var Converter = require("csvtojson").Converter;
            var converter = new Converter({
                delimiter: '\t'
            });
            converter.fromString(body, function(err, resultfinal) {
                var totallength = resultfinal.length;
                var counter = 0;
                 console.log(resultfinal);
                async.each(resultfinal, function(single, callbacks) {
                    var test1=single.asin1;
                    var test2=single["asin1"];
                    /*console.log('f->'+test1);
                    console.log('s->'+test2);*/
                    var sku = single["seller-sku"],
                        asin = single["asin1"],
                        item_name = " ",
                        item_description = " ",
                        price = 0,
                        quantity = 0,
                        pending_quantity = 0,
                        product_id = " ",
                        fulfillment_channel = " ",
                        merchant_shipping_group = " ",
                        listing_id = " ",
                        open_date = new Date().toISOString(),
                        status = "";

                    if (single["item-name"] != "undefined") {
                        item_name = single["item-name"];
                    }

                    if (single["item-description"] != "undefined") {
                        item_description = single["item-description"];
                    }

                    if (single["price"] != "undefined") {
                        price = single["price"];
                    }
                    if (single["quantity"] != "undefined") {
                        quantity = single["quantity"];
                    }

                    if (single["pending-quantity"] != "undefined") {
                        pending_quantity = single["pending-quantity"];
                    }


                    if (single["product-id"] != "undefined") {
                        product_id = single["product-id"];
                    }
                    if (single["fulfillment-channel"] != "undefined") {
                        fulfillment_channel = single["fulfillment-channel"];
                    }
                    if (single["merchant-shipping-group"] != "undefined") {
                        merchant_shipping_group = single["merchant-shipping-group"];
                    }
                    if (single["listing-id"] != "undefined") {
                        listing_id = single["listing-id"];
                    }

                    if (single["open-date"] != "undefined") {
                        open_date = single["open-date"];
                    }
                    if (single["status"] != "undefined") {
                        status = single["status"];
                    }

                    Products.find({ 'productlist.seller_sku': sku, 'productlist.asin': asin, 'productlist.userid': user_id , 'productlist.marketplace' :marketplace }, function(err, resultprod) {

                        if (resultprod.length > 0) {

                           Products.findByIdAndUpdate(resultprod[0]._id,{ 'productlist.seller_sku': sku, 'productlist.asin': asin, 'productlist.item_name': item_name, 'productlist.item_descp': item_description, 'productlist.price': price, 'productlist.quantity': quantity, 'productlist.pending_quantity': pending_quantity, 'productlist.product_id': product_id, 'productlist.fulfillment_channel': fulfillment_channel, 'productlist.merchant_shipping_group': merchant_shipping_group, 'productlist.listing_id': listing_id, 'productlist.open_date': open_date, 'productlist.status': status }, function(err, resultup) {
                               if (err) {

                                    throw err;
                                } else {

                                    callbacks(null);
                                }

                            })
                        } else {


                            var products_detail = new Products();
                            products_detail.productlist.seller_sku = sku;
                            products_detail.productlist.asin = asin;
                            products_detail.productlist.userid = user_id;
                            products_detail.productlist.item_name = item_name;
                            products_detail.productlist.item_descp = item_description;
                            products_detail.productlist.price = price;
                            products_detail.productlist.quantity = quantity;
                            products_detail.productlist.pending_quantity = pending_quantity;
                            products_detail.productlist.product_id = product_id;
                            products_detail.productlist.fulfillment_channel = fulfillment_channel;
                            products_detail.productlist.merchant_shipping_group = merchant_shipping_group;
                            products_detail.productlist.listing_id = listing_id;
                            products_detail.productlist.open_date = open_date;
                            products_detail.productlist.status = status;
                            products_detail.productlist.marketplace = marketplace ;
                             products_detail.productlist.platform = 'Amazon' ;

                            products_detail.save(function(err, responses) {
                                if (err) {
                                    console.log(err);
                                }
                                callbacks(null, responses);
                            })
                        }
                    });
                }, (err, res11) => {
                    if (err) {
                        insert_response.push({'reportid' : genrateid , 'in_rep' : err}) ;
                        next() ;

                    } else {
                        insert_response.push({'reportid' : genrateid , 'in_rep' : res11}) ;
                        next() ;
                        
                    }
                });
            });
        }

    })
                    
                  
},(err,reponse) => {
    done(null, insert_response) ;
})
}