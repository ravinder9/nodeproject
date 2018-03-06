var Products = require('../models/products'); 
var Orders=require('../models/amazonorder'); 
var User = require('../models/user');
var AmzReport = require('../models/amz_generated_report'); 
var csv1 = require('csv');
var express = require('express');
var csv = require('csvtojson');
var async = require('async');
var router = express.Router();
var fs = require('fs');
var amazonMws = require('amazon-mws');
var bodyParser = require('body-parser');
var multer = require('multer');
var path = require('path');
//var ebay = require('ebay-trading-api');
var ebay = require('ebay-api');
//var ebayPromised = require('ebay-promised');
//var env = require('../../env');
//var ebaytrading = require('node-ebay-trading-api');

//var obj = new csv1();
import {
    isLoggedIn
} from '../commonFunctions'
import { getProducts } from '../controllers/products/amazon';
import { getupdatedProduct } from '../controllers/products/amazon_cron';
import { getAmazonDetail } from '../controllers/user/user';
import { getebayProducts } from '../controllers/products/ebay';
import { getEbayDetail } from '../controllers/user/user';
import { getOrders } from '../controllers/products/amazon_order';

/* code start for upload price csv file */
var descsv = path.join(__dirname,'../public/csv');
console.log(__dirname);

var storecsv = multer.diskStorage({ 
    destination: function(req, file, cb) {
        cb(null, descsv)
    },
    filename: function(req, file, cb) {
        cb(null, new Date() + '_' + file.originalname)
    }
});
var uploadcsv = multer({
        storage: storecsv,
        fileFilter: function(req, file, callback) {
            console.log(file);
            var ext = path.extname(file.originalname)
            if (ext !== '.csv' ) {
                return callback('Only csv File excepted', null)
            }
            callback(null, true)
        }
   
    });
/* code end for upload price csv file */
/* code start for upload quantity csv file */
var desqtycsv=path.join(__dirname,'../public/csv/quantity');
console.log(desqtycsv);
var storeqtycsv=multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, desqtycsv)
    },
    filename: function(req, file, cb) {
        cb(null, new Date() + '_' + file.originalname)
    }
});
var uploadqtycsv=multer({
        storage: storecsv,
        fileFilter: function(req, file, callback) {
            var ext = path.extname(file.originalname)
            if (ext !== '.csv' ) {
                return callback('Only csv File excepted', null)
            }
            callback(null, true)
        }
   
    });
/* code end for upload quantity csv file */
router.get('/amazon', isLoggedIn, function(req, res) {
    //console.log(req.session)
    res.render('pages/products/amazon') // load the index.ejs file
});

router.get('/getProducts', isLoggedIn, (req, res) => {

    let keys = [];
    let marketplaces = [];
    getAmazonDetail(req.session.passport.user, (err, details) => {
        if (err)
            res.send('Something Went Wrong')
        getProducts(req.session.passport.user, details, (err, result) => {
            res.send('done')
        })
    })

})




//  ====================================
//  amazon_login_form ==================
//  ====================================

router.get('/amazon_form', isLoggedIn, function(req, res) {

    // render the page and pass in any flash data if it exists
    var query = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: query }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

           


            res.render('amazon_form.ejs', { user: user, message: true });
        }
    });
});






// --------------------------------------

//  ====================================
//  ebay_login_form ==================
//  ====================================

router.get('/ebay_form', isLoggedIn, function(req, res) {

    // render the page and pass in any flash data if it exists
    var query = req.session.passport.user;
    // res.send(query);
    console.log(query);


    User.findOne({
        _id: query
    }).exec(function(err, user) {

        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            //res.send(user) ;

            res.render('ebay_form.ejs', {
                user: user
            });
        }
    });
});









// --------------------------------------

//  =====================================
//  webshop_login_form ==================
//  =====================================

router.get('/webshop_form', isLoggedIn, function(req, res) {

    // render the page and pass in any flash data if it exists
    var query = req.session.passport.user;
    /* res.send(query);*/
    console.log(query);


    User.findOne({
        _id: query
    }).exec(function(err, user) {

        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            //res.send(user) ;

            res.render('webshop_form.ejs', {
                user: user
            });
        }
    });
});


router.post('/webshop_api', isLoggedIn, function(req, res) {
    console.log(req.body);
    var webshopData = req.body;
    console.log(req.session.passport.user);
    var query = req.session.passport.user;
    User.update({
        _id: query
    }, {
        webshop: webshopData
    }, {
        upsert: true
    }, function(err, result) {
        if (err) {
            return err;
        } else {
            console.log(result)
            res.send(result)
        }
    });


});


//------------------------new code ---------------------------//

/* start integration with amazon for get product from different marketplace*/

router.post('/amazon_api', function(req, res) {




    var amz_cred_data = req.body;

    var IN = req.body.IN;
    var NA = req.body.NA;
    var BR = req.body.BR;
    var EU = req.body.EU;
    var CN = req.body.CN;
    var FE = req.body.FE;
//res.send(amz_cred_data);
    var region = {};
    if (IN != null) {
        region.IN = req.body.IN;
    }
    if (NA != null) {
        region.NA = req.body.NA;
    }
    if (BR != null) {
        region.BR = req.body.BR;
    }
    if (EU != null) {
        region.EU = req.body.EU;
    }
    if (CN != null) {
        region.CN = req.body.CN;
    }
    if (FE != null) {
        region.FE = req.body.FE;
    }


   


    var mwsData = { sellerid: req.body.sellerid, secretkey: req.body.secretkey, awsaccesskeyid: req.body.awsaccesskeyid, region: region };

     /*console.log(mwsData);  
     res.send(mwsData);*/

    var amzsellerId = mwsData.sellerid;
    // var amzregion = mws;
   
    var amzsecretkey = mwsData.secretkey;
    var amzawsaccesskeyid = mwsData.awsaccesskeyid;


    //console.log(req.session.passport.user);
    var query = req.session.passport.user;
    User.update({
        _id: query
    }, {
        mws: mwsData
    }, {
        upsert: true
    }, function(err, result) {
        if (err) {

            //res.send(JSON.stringify(err)) ;

            res.send(err);

        } else {
            getAmazonDetail(req.session.passport.user, (err, details) => {
                //  res.send(details);
                if (err)

                    res.send('Something Went Wrong')
                getProducts(req.session.passport.user, details, (err, result) => {
                    //res.send(result);
                    res.redirect('show_product');
                })
            })



           
        }
    });


});
/* end */



/* start show all product */
router.get('/show_product', isLoggedIn, function(req, res) {

    var user_id = req.session.passport.user;


Products.aggregate([ {$match: { 'productlist.userid' : user_id , }}, 
    {$group: {_id: '$productlist.seller_sku',product_id:{$addToSet : "$productlist.product_id"},pending_quantity:{$addToSet : "$productlist.pending_quantity"},quantity:{$addToSet : "$productlist.quantity"},listing_id:{$addToSet : "$productlist.listing_id"},fulfillment_channel:{$addToSet : "$productlist.fulfillment_channel"},item_descp:{$addToSet : "$productlist.item_descp"}, asin : {$addToSet : "$productlist.asin"}, item_name : { $addToSet : "$productlist.item_name"},open_date:{$addToSet : "$productlist.open_date"}, status:{$addToSet : "$productlist.status"},
        price : {$addToSet : "$productlist.price"}, platform : {$addToSet : "$productlist.platform"}, 
        
        count: { $sum: 1 } } } ]) .exec(function(err, product_result) 


        {
//res.send(product_result);
      res.render("pages/products/amazon.ejs", { amazonuser: product_result, user:req.user }); 


})

});
/* end*/

/* start show only amazon product */
router.get('/show_amazon_products', isLoggedIn, function(req, res) {

    var user_id = req.session.passport.user;

 Products.find({'productlist.userid': user_id,'productlist.platform':'Amazon' }).exec(function(err, product_result) {

      res.render("pages/products/amazon_product.ejs", { amazonuser: product_result,user:req.user }); 


})

});
/* end*/

/* start show only ebay product */
router.get('/show_ebay_products', isLoggedIn, function(req, res) {

    var user_id = req.session.passport.user;

 Products.find({'productlist.userid': user_id,'productlist.platform':'Ebay' }).exec(function(err, product_result) {
 res.render("pages/products/ebay_product.ejs", { amazonuser: product_result,user:req.user }); 


})

});
/* end*/

/* edit amazon product price*/

router.get('/edit_amazon_record_price/:id', isLoggedIn, function(req, res) {

 var customerid = req.session.passport.user;
 //res.send(req.params.id );
    Products.find({'productlist.seller_sku': req.params.id }).exec(function(err, productsfind) {

//res.send(productsfind[0].productlist);
       if (productsfind[0].productlist.platform=="Amazon") {
 res.render("pages/products/edit_amazon_record_price", { productsmatch: productsfind,user:req.user,message:true });
        } else {

res.render("pages/products/edit_ebay_record_price", { productsmatch: productsfind,user:req.user ,message:true});
           
        }
    });



});
/* end*/

/* edit amazon product quantity*/
router.get('/edit_amazon_record_quantity/:id', isLoggedIn, function(req, res) {


  Products.find({'productlist.seller_sku': req.params.id }).exec(function(err, productsfind) {

//res.send(productsfind);
        if (productsfind[0].productlist.platform=="Amazon") {
 res.render("pages/products/edit_amazon_record_quantity", { productsmatch: productsfind,user:req.user });
       
        } else {

 res.render("pages/products/edit_ebay_quantity", { productsmatch: productsfind,user:req.user });
            }
    });

});

/* end*/

/* update amazon product price*/

router.post('/update_amazon_price', isLoggedIn, function(req, res) {
var data=req.param("data");

//res.send(data[0].marketplace);

    var seller_sku = req.body.seller_sku;

    var price = req.body.price;
    var user_id = req.session.passport.user;
    var host='';
    var currency='';
User.findOne({ _id: user_id }).exec(function(err, user) {


        var sellerId = user.mws[0].sellerid;
        var awsaccesskeyid = user.mws[0].awsaccesskeyid;
        var secretkey = user.mws[0].secretkey;
        //console.log(awsaccesskeyid);



    // var amazonMws = require('../../node_modules/amazon-mws/lib/amazon-mws')('AKIAJU7SBOMDDDJXFYRA', 'vbZzhgaN+nkhe/+tanIP6Mht1rkD3N+pNN/EVzi4');
    async.eachSeries(data, function (amazondata, next) {
    var seller_sku=amazondata.sku;
    var price=amazondata.price;
    var marketplace=amazondata.marketplace;
    
    switch (marketplace) {
        case "A21TJRUUN4KGV":
            host="mws.amazonservices.in";
            currency='INR';
            break;
        case "ATVPDKIKX0DER":
            host="mws.amazonservices.com";
            currency='USD';
            break;
        case "A2EUQ1WTGCTBG2":
           host="mws.amazonservices.com";
           currency='CAD';
            break;
        case "A1AM78C64UM0Y8":
            host="mws.amazonservices.com";
            currency='MXN';
            break;
        case "A2Q3Y263D00KWC":
            host="mws.amazonservices.com";
            currency='BRL';
            break;
        case "A13V1IB3VIYZZH":
            host="mws-eu.amazonservices.com";
            currency='EUR';
            break;
        case "A1PA6795UKMFR9":
            host="mws-eu.amazonservices.com";
            currency='EUR';
            break;
        case "APJ6JRA9NG5V4":
            host="mws-eu.amazonservices.com";
            currency='EUR';
            break;
        case "A1F83G8C2ARO7P":
            host="mws-eu.amazonservices.com";
            currency='EUR';
        break;
            case "A1RKKUPIHCS9HS":
            host="mws-eu.amazonservices.com";
            currency='EUR';
            break;

        case "A1VC38T7YXB528":
            host="mws.amazonservices.com";
            currency='JPY';
            break;
        case "A39IBJ37TRP1C6":
            host="mws.amazonservices.com";
            currency='AUD';
            break;
        case "AAHKV2X7AFYLW":
           host="mws.amazonservices.com.cn";
           currency='CNY';
            break;
        case "default":
           
    }

        let mws = require('mws-simple')({
            host: host,
            accessKeyId: awsaccesskeyid,
            secretAccessKey: secretkey,
            merchantId: sellerId
        });

        var xml = `<?xml version="1.0" encoding="UTF-8"?><AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
            <Header>
            <DocumentVersion>1.01</DocumentVersion>
              <MerchantIdentifier>` + sellerId + `</MerchantIdentifier> 
            </Header>
            <MessageType>Price</MessageType>
            <Message>
              <MessageID>1</MessageID>
                <Price>
                  <SKU>` + seller_sku + `</SKU>
                  <StandardPrice currency="`+ currency+`">` + price + `</StandardPrice>
                </Price>
            </Message>
          </AmazonEnvelope> ` ;
         

        let submitFeed = {
            feedContent: xml,
            query: {
                Action: 'SubmitFeed',
                Version: '2009-01-01',
                'MarketplaceIdList.Id.1': marketplace,
                FeedType: '_POST_PRODUCT_PRICING_DATA_'
            }
        };
        mws.request(submitFeed, function(error, response) {

        if (error) {
                console.log(error);
                next() ;
            } else {
                //console.log('response', response);
                //res.send(response);
                var feedstatus = response.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedProcessingStatus;
                console.log(feedstatus);
                if (feedstatus == '_SUBMITTED_') {
                    console.log('Your Request Has been Submitted');
                    next();
                } else if (feedstatus == '_INPROGRESS_') {
                    console.log('Your Request is in progess state') ;
                    next() ;
                } else {
                    console.log('error');
                    next() ;
                }

            }





        });

        console.log('before xml');
},(err,response) =>{
    res.send('The price is changed successfuly ') ;
})

});

});
/* end*/

/* update amazon quantity */
router.post('/update_amazon_qty', isLoggedIn, function(req, res) {
var data=req.param("data");

//res.send(data[0].marketplace);

    //var seller_sku = req.body.seller_sku;

    ///var quantity = req.body.quantity;
    var user_id = req.session.passport.user;
    var host='';
    
User.findOne({ _id: user_id }).exec(function(err, user) {


        var sellerId = user.mws[0].sellerid;
        var awsaccesskeyid = user.mws[0].awsaccesskeyid;
        var secretkey = user.mws[0].secretkey;
        console.log(awsaccesskeyid);



        // var amazonMws = require('../../node_modules/amazon-mws/lib/amazon-mws')('AKIAJU7SBOMDDDJXFYRA', 'vbZzhgaN+nkhe/+tanIP6Mht1rkD3N+pNN/EVzi4');
        
async.eachSeries(data, function (amazondata, next) {
    var seller_sku=amazondata.sku;
    var quantity=amazondata.quantity;
    var marketplace=amazondata.marketplace;
    switch (marketplace) {
        case "A21TJRUUN4KGV":
            host="mws.amazonservices.in";
            break;
        case "ATVPDKIKX0DER":
            host="mws.amazonservices.com";
            break;
        case "A2EUQ1WTGCTBG2":
           host="mws.amazonservices.com";
            break;
        case "A1AM78C64UM0Y8":
            host="mws.amazonservices.com";
            break;
        case "A2Q3Y263D00KWC":
            host="mws.amazonservices.com";
            break;
        case "A13V1IB3VIYZZH":
            host="mws-eu.amazonservices.com";
            break;
        case "A1PA6795UKMFR9":
            host="mws-eu.amazonservices.com";
            break;
        case "APJ6JRA9NG5V4":
            host="mws-eu.amazonservices.com";
            break;
        case "A1F83G8C2ARO7P":
            host="mws-eu.amazonservices.com";
        break;
            case "A1RKKUPIHCS9HS":
            host="mws-eu.amazonservices.com";
            break;

        case "A1VC38T7YXB528":
            host="mws.amazonservices.com";
            break;
        case "A39IBJ37TRP1C6":
            host="mws.amazonservices.com";
            break;
        case "AAHKV2X7AFYLW":
           host="mws.amazonservices.com.cn";
            break;
        case "default":
           
    }

        let mws = require('mws-simple')({
            host: host,
            accessKeyId: awsaccesskeyid,
            secretAccessKey: secretkey,
            merchantId: sellerId
        });

        var xml = `<?xml version="1.0" encoding="UTF-8"?><AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
            <Header>
            <DocumentVersion>1.01</DocumentVersion>
              <MerchantIdentifier>` + sellerId + `</MerchantIdentifier>
            </Header>
           <MessageType>Inventory</MessageType>
            <Message>
              <MessageID>1</MessageID>
               <Inventory>
                  <SKU>` + seller_sku + `</SKU>
                  <Quantity>` + quantity + `</Quantity>
               </Inventory>
            </Message>
          </AmazonEnvelope>` ;
         

        let submitFeed = {
            feedContent: xml,
            query: {
                Action: 'SubmitFeed',
                Version: '2009-01-01',
                'MarketplaceIdList.Id.1': marketplace,
                FeedType: '_POST_INVENTORY_AVAILABILITY_DATA_'
            }
        };
        mws.request(submitFeed, function(error, response) {

        if (error) {
                console.log(error);
                next() ;
            } else {
                //console.log('response', response);
                //res.send(response);
                var feedstatus = response.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedProcessingStatus;
                console.log(feedstatus);
                if (feedstatus == '_SUBMITTED_') {
                    console.log('Your Request Has been Submitted');
                    next();
                } else if (feedstatus == '_INPROGRESS_') {
                    console.log('Your Request is in progess state') ;
                    next() ;
                } else {
                    console.log('error');
                    next() ;
                }

            }





        });
/*xml.push({'xml' : test}) ;
        next();*/
} , (err,response) => {
    
    res.send('The quantity is changed successfuly.') ;
})

});
    });

/* end*/

/*router.get('/updated_product',isLoggedIn, function(req, res) {
    
    var details=[];
    User.find({'local.role':'customer'}).exec( function (err,users){

        async.eachSeries(users, function (userdetail, next) {
var sellerid=userdetail.mws[0].sellerid;
var secretkey=userdetail.mws[0].secretkey;
var awsaccesskeyid=userdetail.mws[0].awsaccesskeyid;
var region=userdetail.mws[0].region;
var userid=userdetail._id;
 details={ sellerid: sellerid, secretkey: secretkey, awsaccesskeyid: awsaccesskeyid, region: region };
details={ 'sellerid': 'AUHPZTSGVUCW1', 'secretkey': 'vbZzhgaN+nkhe/+tanIP6Mht1rkD3N+pNN/EVzi4', 'awsaccesskeyid': 'AKIAJU7SBOMDDDJXFYRA', 'region': {"IN" : [ 
                "A21TJRUUN4KGV"
            ]} };


  getupdatedProduct(userid, details, (err, result) => {
    console.log('geupdated product done. call next');
    next();
                    
                })

       } ,(err,reponse) => {

        console.log('done for all ');
        res.redirect('show_product');
   // res.send(details)
})

    });

});*/

/* update amazon product price with csv file*/
router.get('/update_product_with_csv', isLoggedIn, function(req, res) {
   
 var query = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: query }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('amazon_csv_form.ejs', { user: user, message: true });
        }
    });

    });
router.post('/update_product_with_csv', isLoggedIn,uploadcsv.any(), function(req, res) {
    //res.send('aaaaaa');
            var user_id = req.session.passport.user;
            var file_name = req.files[0].path;
            var csvdata = [] ;

    User.findOne({ _id: user_id }).exec(function(err, user) {


                var sellerId = user.mws[0].sellerid;
                var awsaccesskeyid = user.mws[0].awsaccesskeyid;
                var secretkey = user.mws[0].secretkey;
                console.log(awsaccesskeyid);

    csv()
    .fromFile(file_name)
    .on('json',(jsonObj)=>{
        csvdata.push(jsonObj) ;
       
    })
    .on('done',(error)=>{
     
                    var resultdata=[];
                    async.eachSeries(csvdata, function (productdata, next) {
                                var seller_sku=productdata.sku;
                                var asin=productdata.asin;
                                india() ;
                                function india()
                                {    
                                    if(productdata.IN_price!="")
                                    {

                                        Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A21TJRUUN4KGV','productlist.userid':user_id }, function(err, result) {
                                            if(result.length > 0)
                                            {

                                               var price=productdata.IN_price;
                                               var marketplace='A21TJRUUN4KGV';
                                               var host="mws.amazonservices.in";
                                               var currency='INR';
                                               var product_sku=seller_sku;
                                                resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                                console.log('in');
                                                usa() ;
                                               
                                            } 
                                            else
                                            {
                                                usa();
                                            }
                                        });

                                       
                                    }
                                    else
                                    {
                                        usa() ;
                                    }

                                }
                        function usa()
                        {
                          
                            if(productdata.US_price != "")
                            {

                                console.log('in usa if part') ;
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'ATVPDKIKX0DER','productlist.userid':user_id }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.US_price;
                                            var  marketplace='ATVPDKIKX0DER';
                                            var  host="mws.amazonservices.com";
                                            var  currency='USD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            ca() ;                 
                                         }
                                        else
                                        {
                                        ca() ;
                                        }

                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                                ca();
                            }

                        }

                        function ca()
                        {
                             if(productdata.CA_price != "")
                                {  
                                    Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A2EUQ1WTGCTBG2','productlist.userid':user_id }, function(err, result) {
                                        if(result.length > 0)
                                            {
                                                var price=productdata.CA_price;
                                                var  marketplace='A2EUQ1WTGCTBG2';
                                                var  host="mws.amazonservices.com";
                                                var  currency='CAD';
                                                var product_sku=seller_sku;
                                                resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                                 mx() ;
                                                            
                                            }
                                            else
                                            {
                                            mx() ;
                                            }

                                        });
                                }
                                else
                                {
                                    console.log('in usa else part');
                                    mx();
                                } 
                        }
                         function mx()
                         {
                         if(productdata.MX_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'ATVPDKIKX0DER','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.MX_price;
                                            var  marketplace='A1AM78C64UM0Y8';
                                            var  host="mws.amazonservices.com";
                                            var  currency='MXN';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            br() ;
                                        }
                                        else
                                        {
                                        br() ;
                                        }

                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                                br();
                            } 
                         }

                         function br()
                         {
                        if(productdata.BR_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A2Q3Y263D00KWC','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.BR_price;
                                            var  marketplace='A2Q3Y263D00KWC';
                                            var  host="mws.amazonservices.com";
                                            var  currency='BRL';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            fr() ;
                                                                
                                        }
                                        else
                                        {
                                         fr() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                                fr();
                            }
                         }

                         function fr()
                         {
                        if(productdata.FR_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A13V1IB3VIYZZH','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                             var price=productdata.FR_price;
                                             var  marketplace='A13V1IB3VIYZZH';
                                             var  host="mws-eu.amazonservices.com";
                                             var  currency='EUR';
                                             var product_sku=seller_sku;
                                              resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                              de() ;
                                                            
                                            }
                                            else
                                            {
                                                de() ;
                                             }



                                        });
                                }
                                else
                                {
                                //console.log('in usa else part');
                                    de();
                                }
                         }

                         function de()
                         {
                            if(productdata.DE_price != "")
                            {
                              Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1PA6795UKMFR9','productlist.userid':user_id  }, function(err, result) {
                                if(result.length > 0)
                                    {
                                        var price=productdata.DE_price;
                                        var  marketplace='A1PA6795UKMFR9';
                                        var  host="mws-eu.amazonservices.com";
                                        var  currency='EUR';
                                        var product_sku=seller_sku;
                                        resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                         it() ;
                                     }
                                    else
                                    {
                                        it() ;
                                     }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               it();
                            }
                         }
                         function it()
                         {
                           if(productdata.IT_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'APJ6JRA9NG5V4','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.IT_price;
                                            var  marketplace='APJ6JRA9NG5V4';
                                            var  host="mws-eu.amazonservices.com";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            uk() ;
                                                            
                                        }
                                        else
                                        {
                                        uk() ;
                                        }

                                    });
                                }
                                else
                                {
                                //console.log('in usa else part');
                                uk();
                                }
                         }

                         function uk()
                         {
                            if(productdata.UK_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1F83G8C2ARO7P','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.UK_price;
                                            var  marketplace='A1F83G8C2ARO7P';
                                            var  host="mws-eu.amazonservices.com";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            es() ;
                                        }
                                        else
                                        {
                                                es() ;
                                        }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                                es();
                            }
                         }
                         function es()
                         {
                            if(productdata.ES_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1RKKUPIHCS9HS','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.ES_price;
                                            var  marketplace='A1RKKUPIHCS9HS';
                                            var  host="mws-eu.amazonservices.com";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            jp() ;
                                                            
                                        }
                                        else
                                            {
                                                jp() ;
                                            }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               jp();
                            }
                         }

                         function jp()
                         {
                              if(productdata.JP_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1VC38T7YXB528','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.JP_price;
                                            var  marketplace='A1VC38T7YXB528';
                                            var  host="mws.amazonservices.com";
                                            var  currency='JPY';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            au() ;
                                                            
                                        }
                                        else
                                        {
                                             au() ;
                                         }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                                au();
                            }
                         }

                         function au()
                         {
                             if(productdata.AU_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A39IBJ37TRP1C6','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.AU_price;
                                            var  marketplace='A39IBJ37TRP1C6';
                                            var  host="mws.amazonservices.com";
                                            var  currency='AUD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                            cn() ;
                                        }
                                        else
                                        {
                                            cn() ;
                                        }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                               cn();
                            }
                         }
                        function cn()
                        {
                         if(productdata.CN_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'AAHKV2X7AFYLW','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.CN_price;
                                            var  marketplace='AAHKV2X7AFYLW';
                                            var  host="mws.amazonservices.com.cn";
                                            var  currency='CNY';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'price':price,'host':host,'currency':currency,'product_sku':product_sku})
                                             final() ;
                                                            
                                        }
                                        else
                                        {
                                            final() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               final();
                            }
                            
                            
                        }




                        function final()
                        {
                            console.log('in final') ;
                            next() ;
                        }

                           

            },(err,response) =>{
               
                                    async.eachSeries(resultdata, function (productdata, callback) {
                                        var marketplace=productdata.marketplace;
                                        var price=productdata.price;
                                        var currency=productdata.currency;
                                        var host=productdata.host;
                                        var product_sku=productdata.product_sku;
                                        let mws = require('mws-simple')({
                                                    host: host,
                                                    accessKeyId: awsaccesskeyid,
                                                    secretAccessKey: secretkey,
                                                    merchantId: sellerId
                                            });

                                        var xml = `<?xml version="1.0" encoding="UTF-8"?><AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
                                            <Header>
                                            <DocumentVersion>1.01</DocumentVersion>
                                              <MerchantIdentifier>` + sellerId + `</MerchantIdentifier>
                                            </Header>
                                            <MessageType>Price</MessageType>
                                            <Message>
                                              <MessageID>1</MessageID>
                                                <Price>
                                                  <SKU>` + product_sku + `</SKU>
                                                  <StandardPrice currency="`+ currency+`">` + price + `</StandardPrice>
                                                </Price>
                                            </Message>
                                          </AmazonEnvelope> ` ;
                    // xml1.push(xml);

                                            let submitFeed = {
                                                feedContent: xml,
                                                query: {
                                                    Action: 'SubmitFeed',
                                                    Version: '2009-01-01',
                                                    'MarketplaceIdList.Id.1': marketplace,
                                                    FeedType: '_POST_PRODUCT_PRICING_DATA_'
                                                }
                                            };
                                    mws.request(submitFeed, function(error, response) {

                                            if (error) {
                                                    console.log(error);
                                                   callback() ;
                                                } else {
                                                    //console.log('response', response);
                                                    //res.send(response);
                                                    var feedstatus = response.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedProcessingStatus;
                                                    console.log(feedstatus);
                                                    if (feedstatus == '_SUBMITTED_') {
                                                        console.log('Your Request Has been Submitted');
                                                        callback();
                                                    } else if (feedstatus == '_INPROGRESS_') {
                                                        console.log('Your Request is in progess state') ;
                                                        callback() ;
                                                    } else {
                                                        console.log('error');
                                                        callback() ;
                                                    }

                                                }


                                        });


                              },(err,response)=>{

          if (err) {
res.render('amazon_csv_form.ejs', { error: 'Something went Wrong' });
}
else
{
res.render('amazon_csv_form.ejs', { message: 'price changed successfuly' }); 
}


                              })

            })



});

 });
 });
/* end*/
/* update amazont product quantity with csv file*/
router.get('/update_quantity_with_csv', isLoggedIn, function(req, res) {
   
 var query = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: query }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('amazon_qty_csv_form.ejs', { user: user, message: true });
        }
    });

    });
router.post('/update_quantity_with_csv', isLoggedIn,uploadqtycsv.any(), function(req, res) {
            var user_id = req.session.passport.user;
            var file_name = req.files[0].path;
            var csvdata = [] ;

    User.findOne({ _id: user_id }).exec(function(err, user) {


                        var sellerId = user.mws[0].sellerid;
                        var awsaccesskeyid = user.mws[0].awsaccesskeyid;
                        var secretkey = user.mws[0].secretkey;
                        console.log(awsaccesskeyid);

                        csv()
                        .fromFile(file_name)
                        .on('json',(jsonObj)=>{
                            csvdata.push(jsonObj) ;
                           
                                            
                                            })
                        .on('done',(error)=>{

                                                            var resultdata=[];
                    async.eachSeries(csvdata, function (productdata, next) {
                                var seller_sku=productdata.sku;
                                var asin=productdata.asin;
                                india() ;
                                function india()
                                {    
                                    

                                        Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A21TJRUUN4KGV','productlist.userid':user_id }, function(err, result) {
                                            if(result.length > 0)
                                            {

                                               var qty=productdata.quantity;
                                               var marketplace='A21TJRUUN4KGV';
                                               var host="mws.amazonservices.in";
                                               var product_sku=seller_sku;
                                                resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                                console.log('in');
                                                usa() ;
                                               
                                            } 
                                            else
                                            {
                                                usa();
                                            }
                                        });

                                       
                                    

                                }
                        function usa()
                        {
                          
                            
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'ATVPDKIKX0DER','productlist.userid':user_id }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='ATVPDKIKX0DER';
                                            var  host="mws.amazonservices.com";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            ca() ;                 
                                         }
                                        else
                                        {
                                        ca() ;
                                        }

                                });
                            

                        }

                        function ca()
                        {
                             
                                    Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A2EUQ1WTGCTBG2','productlist.userid':user_id }, function(err, result) {
                                        if(result.length > 0)
                                            {
                                                var qty=productdata.quantity;
                                                var  marketplace='A2EUQ1WTGCTBG2';
                                                var  host="mws.amazonservices.com";
                                                var product_sku=seller_sku;
                                                resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                                 mx() ;
                                                            
                                            }
                                            else
                                            {
                                            mx() ;
                                            }

                                        });
                                
                        }
                         function mx()
                         {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'ATVPDKIKX0DER','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A1AM78C64UM0Y8';
                                            var  host="mws.amazonservices.com";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            br() ;
                                        }
                                        else
                                        {
                                        br() ;
                                        }

                                });
                             
                         }

                         function br()
                         {
                        
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A2Q3Y263D00KWC','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A2Q3Y263D00KWC';
                                            var  host="mws.amazonservices.com";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            fr() ;
                                                                
                                        }
                                        else
                                        {
                                         fr() ;
                                        }



                                });
                            
                            
                         }

                         function fr()
                         {
                        
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A13V1IB3VIYZZH','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                             var qty=productdata.quantity;
                                             var  marketplace='A13V1IB3VIYZZH';
                                             var  host="mws-eu.amazonservices.com";
                                             var  currency='EUR';
                                             var product_sku=seller_sku;
                                              resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                              de() ;
                                                            
                                            }
                                            else
                                            {
                                                de() ;
                                             }



                                        });
                                
                                
                         }

                         function de()
                         {
                            
                              Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1PA6795UKMFR9','productlist.userid':user_id  }, function(err, result) {
                                if(result.length > 0)
                                    {
                                        var qty=productdata.quantity;
                                        var  marketplace='A1PA6795UKMFR9';
                                        var  host="mws-eu.amazonservices.com";
                                        var product_sku=seller_sku;
                                        resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                         it() ;
                                     }
                                    else
                                    {
                                        it() ;
                                     }



                                });
                            
                         }
                         function it()
                         {
                           
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'APJ6JRA9NG5V4','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='APJ6JRA9NG5V4';
                                            var  host="mws-eu.amazonservices.com";
                                            
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            uk() ;
                                                            
                                        }
                                        else
                                        {
                                        uk() ;
                                        }

                                    });
                                
                                
                         }

                         function uk()
                         {
                            
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1F83G8C2ARO7P','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A1F83G8C2ARO7P';
                                            var  host="mws-eu.amazonservices.com";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            es() ;
                                        }
                                        else
                                        {
                                                es() ;
                                        }



                                });
                            
                         }
                         function es()
                         {
                            
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1RKKUPIHCS9HS','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A1RKKUPIHCS9HS';
                                            var  host="mws-eu.amazonservices.com";
                                             var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            jp() ;
                                                            
                                        }
                                        else
                                            {
                                                jp() ;
                                            }



                                });
                            
                         }

                         function jp()
                         {
                             
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A1VC38T7YXB528','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A1VC38T7YXB528';
                                            var  host="mws.amazonservices.com";
                                            var  currency='JPY';
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            au() ;
                                                            
                                        }
                                        else
                                        {
                                             au() ;
                                         }



                                });
                            
                         }

                         function au()
                         {
                             
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'A39IBJ37TRP1C6','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='A39IBJ37TRP1C6';
                                            var  host="mws.amazonservices.com";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                            cn() ;
                                        }
                                        else
                                        {
                                            cn() ;
                                        }



                                });
                            
                         }
                        function cn()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.marketplace':'AAHKV2X7AFYLW','productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var qty=productdata.quantity;
                                            var  marketplace='AAHKV2X7AFYLW';
                                            var  host="mws.amazonservices.com.cn";
                                            var product_sku=seller_sku;
                                            resultdata.push({'marketplace':marketplace,'qty':qty,'host':host,'product_sku':product_sku})
                                             final() ;
                                                            
                                        }
                                        else
                                        {
                                            final() ;
                                        }



                                });
                           
                            
                            
                        }




                        function final()
                        {
                            console.log('in final') ;
                            next() ;
                        }

                           

            },(err,response) =>{
                                   // res.send(resultdata);
               
                                   async.eachSeries(resultdata, function (productdata, callback) {
                                        var marketplace=productdata.marketplace;
                                        var quantity=productdata.qty;
                                        var host=productdata.host;
                                        var product_sku=productdata.product_sku;
                                        let mws = require('mws-simple')({
                                                    host: host,
                                                    accessKeyId: awsaccesskeyid,
                                                    secretAccessKey: secretkey,
                                                    merchantId: sellerId
                                            });

                                        var xml = `<?xml version="1.0" encoding="UTF-8"?><AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
                                                    <Header>
                                                    <DocumentVersion>1.01</DocumentVersion>
                                                      <MerchantIdentifier>` + sellerId + `</MerchantIdentifier>
                                                    </Header>
                                                   <MessageType>Inventory</MessageType>
                                                    <Message>
                                                      <MessageID>1</MessageID>
                                                       <Inventory>
                                                          <SKU>` + product_sku + `</SKU>
                                                          <Quantity>` + quantity + `</Quantity>
                                                       </Inventory>
                                                    </Message>
                                                  </AmazonEnvelope>` ;
                    // xml1.push(xml);

                                            let submitFeed = {
                                                feedContent: xml,
                                                query: {
                                                    Action: 'SubmitFeed',
                                                    Version: '2009-01-01',
                                                    'MarketplaceIdList.Id.1': marketplace,
                                                    FeedType: '_POST_INVENTORY_AVAILABILITY_DATA_'
                                                }
                                            };
                                    mws.request(submitFeed, function(error, response) {

                                            if (error) {
                                                    console.log(error);
                                                   callback() ;
                                                } else {
                                                    //console.log('response', response);
                                                    //res.send(response);
                                                    var feedstatus = response.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedProcessingStatus;
                                                    console.log(feedstatus);
                                                    if (feedstatus == '_SUBMITTED_') {
                                                        console.log('Your Request Has been Submitted');
                                                        callback();
                                                    } else if (feedstatus == '_INPROGRESS_') {
                                                        console.log('Your Request is in progess state') ;
                                                        callback() ;
                                                    } else {
                                                        console.log('error');
                                                        callback() ;
                                                    }

                                                }


                                        });


                              },(err,response)=>{
if (err) {
res.render('amazon_qty_csv_form.ejs', { error: 'Something went Wrong' });
}
else
{
res.render('amazon_qty_csv_form.ejs', { message: 'Quantity changed successfuly' }); 
}

                              })

            })



                                            })


    })
})

/* end*/
/* update ebay product price with csv file*/
router.get('/update_ebay_product_with_csv', isLoggedIn, function(req, res) {
   
 var query = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: query }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('ebay_product_csv_form.ejs', { user: user, message: true });
        }
    });

    });
router.post('/update_ebay_product_with_csv', isLoggedIn,uploadqtycsv.any(), function(req, res) {
    //res.send('aaaaaa');
            var user_id = req.session.passport.user;
            var file_name = req.files[0].path;
            var csvdata = [] ;

    User.findOne({ _id: user_id }).exec(function(err, user) {


                var appid = user.ebay[0].clientid;
                var certid = user.ebay[0].clientsecret;
                var devid = user.ebay[0].devid;
                //console.log(awsaccesskeyid);

    csv()
    .fromFile(file_name)
    .on('json',(jsonObj)=>{
        csvdata.push(jsonObj) ;
       
    })
    .on('done',(error)=>{
     //res.send(csvdata);
                    var resultdata=[];
                    async.eachSeries(csvdata, function (productdata, next) {
                                var seller_sku=productdata.sku;
                               
                                AU() ;
                                function AU()
                                {    
                                    if(productdata.Australia_price!="")
                                    {

                                        Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id }, function(err, result) {
                                            if(result.length > 0)
                                            {

                                               var price=productdata.Australia_price;
                                               
                                               var siteid="15";
                                               var currency='AUD';
                                               var product_sku=seller_sku;
                                                resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                                console.log('AU');
                                                AT() ;
                                               
                                            } 
                                            else
                                            {
                                                AT();
                                            }
                                        });

                                       
                                    }
                                    else
                                    {
                                        AT() ;
                                    }

                                }
                        function AT()
                        {
                          
                            if(productdata.Austria_price != "")
                            {

                                console.log('in au if part') ;
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Austria_price;
                                            
                                            var  siteid="16";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            BD() ;                 
                                         }
                                        else
                                        {
                                        BD() ;
                                        }

                                });
                            }
                            else
                            {
                                console.log('in BD else part');
                                BD();
                            }

                        }

                        function BD()
                        {
                             if(productdata.BD_price != "")
                                {  
                                    Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id }, function(err, result) {
                                        if(result.length > 0)
                                            {
                                                var price=productdata.BD_price;
                                            
                                                var  siteid="123";
                                                var  currency='EUR';
                                                var product_sku=seller_sku;
                                                resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                                 BF() ;
                                                            
                                            }
                                            else
                                            {
                                            BF() ;
                                            }

                                        });
                                }
                                else
                                {
                                    console.log('in usa else part');
                                    BF();
                                } 
                        }
                         function BF()
                         {
                         if(productdata.BEFR_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.BEFR_price;
                                           
                                            var  siteid="23";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            CA() ;
                                        }
                                        else
                                        {
                                        CA() ;
                                        }

                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                                CA();
                            } 
                         }

                         function CA()
                         {
                        if(productdata.Canada_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Canada_price;
                                            
                                            var  siteid="2";
                                            var  currency='CAD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            CF() ;
                                                                
                                        }
                                        else
                                        {
                                         CF() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                                CF();
                            }
                         }

                         function CF()
                         {
                        if(productdata.CAFR_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                             var price=productdata.FR_price;
                                             
                                             var  siteid="210";
                                             var  currency='EUR';
                                             var product_sku=seller_sku;
                                              resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                              FR() ;
                                                            
                                            }
                                            else
                                            {
                                                FR() ;
                                             }



                                        });
                                }
                                else
                                {
                                //console.log('in usa else part');
                                    FR();
                                }
                         }

                         function FR()
                         {
                            if(productdata.France_price != "")
                            {
                              Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                if(result.length > 0)
                                    {
                                        var price=productdata.France_price;
                                        
                                        var  siteid="71";
                                        var  currency='EUR';
                                        var product_sku=seller_sku;
                                        resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                         GR() ;
                                     }
                                    else
                                    {
                                        GR() ;
                                     }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               GR();
                            }
                         }
                         function GR()
                         {
                           if(productdata.Germany_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Germany_price;
                                           
                                            var  siteid="77";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            HK() ;
                                                            
                                        }
                                        else
                                        {
                                        HK() ;
                                        }

                                    });
                                }
                                else
                                {
                                //console.log('in usa else part');
                                HK();
                                }
                         }

                         function HK()
                         {
                            if(productdata.HongKong_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.HongKong_price;
                                            
                                            var  siteid="201";
                                            var  currency='HKD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            IN() ;
                                        }
                                        else
                                        {
                                                IN() ;
                                        }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                                IN();
                            }
                         }
                         function IN()
                         {
                            if(productdata.India_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.India_price;
                                            
                                            var  siteid="203";
                                            var  currency='INR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            IR() ;
                                                            
                                        }
                                        else
                                            {
                                                IR() ;
                                            }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               IR();
                            }
                         }

                         function IR()
                         {
                              if(productdata.Ireland_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Ireland_price;
                                            
                                            var  siteid="205";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            IT() ;
                                                            
                                        }
                                        else
                                        {
                                             IT() ;
                                         }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                                IT();
                            }
                         }

                         function IT()
                         {
                             if(productdata.Italy_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Italy_price;
                                            
                                            var  siteid="101";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            ML() ;
                                        }
                                        else
                                        {
                                            ML() ;
                                        }



                                });
                            }
                            else
                            {
                                //console.log('in usa else part');
                               ML();
                            }
                         }
                        function ML()
                        {
                         if(productdata.Malaysia_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Malaysia_price;
                                           
                                            var  siteid="207";
                                            var  currency='MYR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             NL() ;
                                                            
                                        }
                                        else
                                        {
                                            NL() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               NL();
                            }
                            
                            
                        }
function NL()
                        {
                         if(productdata.Netherlands_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Netherlands_price;
                                           
                                            var  siteid="146";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             PP() ;
                                                            
                                        }
                                        else
                                        {
                                            PP() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               PP();
                            }
                            
                            
                        }
function PP()
                        {
                         if(productdata.Philippines_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Philippines_price;
                                           
                                            var  siteid="211";
                                            var  currency='PHP';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             PL() ;
                                                            
                                        }
                                        else
                                        {
                                            PL() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               PL();
                            }
                            
                            
                        }
function PL()
                        {
                         if(productdata.Poland_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Poland_price;
                                           
                                            var  siteid="212";
                                            var  currency='PLN';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             RU() ;
                                                            
                                        }
                                        else
                                        {
                                            RU() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               RU();
                            }
                            
                            
                        }
function RU()
                        {
                         if(productdata.Russia_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Russia_price;
                                           
                                            var  siteid="215";
                                            var  currency='RUB';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SGP() ;
                                                            
                                        }
                                        else
                                        {
                                            SGP() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               SGP();
                            }
                            
                            
                        }
                        function SGP()
                        {
                         if(productdata.Singapore_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Singapore_price;
                                           
                                            var  siteid="216";
                                            var  currency='SGD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SP() ;
                                                            
                                        }
                                        else
                                        {
                                            SP() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               SP();
                            }
                            
                            
                        }
                        function SP()
                        {
                         if(productdata.Spain_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Spain_price;
                                           
                                            var  siteid="186";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SW() ;
                                                            
                                        }
                                        else
                                        {
                                            SW() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               SW();
                            }
                            
                            
                        }
                   function SW()
                        {
                         if(productdata.Switzerland_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.Switzerland_price;
                                           
                                            var  siteid="193";
                                            var  currency='CHF';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             UK() ;
                                                            
                                        }
                                        else
                                        {
                                            UK() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               UK();
                            }
                            
                            
                        }
                        function UK()
                        {
                         if(productdata.UK_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.UK_price;
                                           
                                            var  siteid="3";
                                            var  currency='GBP';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             US() ;
                                                            
                                        }
                                        else
                                        {
                                            US() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               US();
                            }
                            
                            
                        }
function US()
                        {
                         if(productdata.US_price != "")
                            {
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            var price=productdata.US_price;
                                           
                                            var  siteid="0";
                                            var  currency='USD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'price':price,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             final() ;
                                                            
                                        }
                                        else
                                        {
                                            final() ;
                                        }



                                });
                            }
                            else
                            {
                                console.log('in usa else part');
                               final();
                            }
                            
                            
                        }

                        function final()
                        {
                            console.log('in final') ;
                            next() ;
                        }

                           

            },(err,response) =>{
               //res.send(resultdata);
               //var as=[];
                                    async.eachSeries(resultdata, function (productdata, callback) {

                                        var price=productdata.price;
    var itemid=productdata.product_sku;
    var siteid=productdata.siteid;
    console.log(siteid);
var authToken='AgAAAA**AQAAAA**aAAAAA**+uReWg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GmAZCFoAydj6x9nY+seQ**b3MEAA**AAMAAA**6b8JBXjqafigc/FbBH/xL6uG1/42MzLqpnTEE0JtdwbBpuSs2WxPtbC4WVIWiUjhGafNaJ2r/a59DLzelOLfGmPKVxlEg3qJ82okXctkldZ0M5WarZ75l8vmyA1tlOsCOq56AcvwCYq15H72M1DNtUY8TEOuoAX1rJu39fY/XSDppzamK5naXAOr3DHBYmv7Y7vQbVAtKYRDDbRyMOi8E76kVtamPvadVZaWf1oQQpxzvpyFWu2d3mm5sh6X3HwzpGUtgDosZnr6c7CeZHxXofO7KbUDeJh4yMPCOVTTyU2+XDbY2krKuZtJcpSc7tfwMNNTVy6SffuZEtq9lfGQSgUGoEWVq4AmKSlyti5Kbg96lty0AYXErvABQjioOOh126Fl5IywYATcj6gGIMuLJPal2YZD4b+DYcb0UvzHl3SN+p51VFm7vooxEPtz4nNnTnvN6f0Irs4rGJUn3Z09UBTSYaqwPVbH0iV+MxgQVbyLAvoZZJHqRmqPH9Ee91q0neX2hPOpuslSKumr1ZY+kSCt/8nBz1Wa18QI2HiDRrUmfLORIhMxJDv+HjXeAADV+NohXKalCuxEGfZA1Ewk6LBS3/L60z2/9LN7zbvn74qPZ6zMkVnSairBd41OB1B7LhO7yD79Ib39A9MOn3jLbeyjJk5d/Uzcly0SMkLPl01e3KQ7eTfIPcKY+Er/hzLFLiTyZ89uY5c8sPmcCL61WetgkM26e+3ao3/5FP54gotKZ0B4OSyFKai6gSe3OcwW';
//as.push({'price':price})
//callback();
ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'ReviseItem',
            callname:'price',
            appId: appid,
            certId: certid,
            devId: devid,
            sandbox: true,
            siteid:siteid,
            price:price,
            token:authToken,
            itemid:itemid, 
          });
callback();
       


                              },(err,response)=>{
                                //res.send(as)
res.render('ebay_product_csv_form.ejs', {user:user, message: 'price changed successfuly' }); 
       

                              })

            })



});

 });
 });
router.get('/update_ebay_quantity_with_csv', isLoggedIn, function(req, res) {
   
 var query = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: query }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('ebay_quantity_csv_form.ejs', { user: user, message: true });
        }
    });

    });
router.post('/update_ebay_quantity_with_csv', isLoggedIn,uploadqtycsv.any(), function(req, res) {
    //res.send('aaaaaa');
            var user_id = req.session.passport.user;
            var file_name = req.files[0].path;
            var csvdata = [] ;

    User.findOne({ _id: user_id }).exec(function(err, user) {


                var appid = user.ebay[0].clientid;
                var certid = user.ebay[0].clientsecret;
                var devid = user.ebay[0].devid;
                //console.log(awsaccesskeyid);

    csv()
    .fromFile(file_name)
    .on('json',(jsonObj)=>{
        csvdata.push(jsonObj) ;
       
    })
    .on('done',(error)=>{
     //res.send(csvdata);
                    var resultdata=[];
                    async.eachSeries(csvdata, function (productdata, next) {
                                var seller_sku=productdata.sku;
                                var quantity=productdata.quantity;
                               
                                AU() ;
                                function AU()
                                {    
                                    

                                        Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'15' }, function(err, result) {
                                            if(result.length > 0)
                                            {

                                               
                                               
                                               var siteid="15";
                                               var currency='AUD';
                                               var product_sku=seller_sku;
                                                resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                                console.log('AU');
                                                AT() ;
                                               
                                            } 
                                            else
                                            {
                                                AT();
                                            }
                                        });

                                       
                                    

                                }
                        function AT()
                        {
                          
                            

                               
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'16' }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                            
                                            var  siteid="16";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            BD() ;                 
                                         }
                                        else
                                        {
                                        BD() ;
                                        }

                                });
                           
                            

                        }

                        function BD()
                        {
                              
                                    Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'123' }, function(err, result) {
                                        if(result.length > 0)
                                            {
                                               
                                            
                                                var  siteid="123";
                                                var  currency='EUR';
                                                var product_sku=seller_sku;
                                                resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                                 BF() ;
                                                            
                                            }
                                            else
                                            {
                                            BF() ;
                                            }

                                        });
                               
                                
                        }
                         function BF()
                         {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'23'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                           
                                            var  siteid="23";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            callback() ;
                                        }
                                        else
                                        {
                                        CA() ;
                                        }

                                });
                            
                            
                         }

                         function CA()
                         {
                       
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'2'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                            
                                            var  siteid="2";
                                            var  currency='CAD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            CF() ;
                                                                
                                        }
                                        else
                                        {
                                         CF() ;
                                        }



                                });
                            
                         }

                         function CF()
                         {
                        
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id ,'productlist.marketplace':'210' }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                             
                                             
                                             var  siteid="210";
                                             var  currency='EUR';
                                             var product_sku=seller_sku;
                                              resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                              FR() ;
                                                            
                                            }
                                            else
                                            {
                                                FR() ;
                                             }



                                        });
                                
                         }

                         function FR()
                         {
                            
                              Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'71'  }, function(err, result) {
                                if(result.length > 0)
                                    {
                                       
                                        
                                        var  siteid="71";
                                        var  currency='EUR';
                                        var product_sku=seller_sku;
                                        resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                         GR() ;
                                     }
                                    else
                                    {
                                        GR() ;
                                     }



                                });
                            
                           
                         }
                         function GR()
                         {
                           
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'77'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="77";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            HK() ;
                                                            
                                        }
                                        else
                                        {
                                        HK() ;
                                        }

                                    });
                                
                         }

                         function HK()
                         {
                            
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'201'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                            
                                            var  siteid="201";
                                            var  currency='HKD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'host':host,'currency':currency,'product_sku':product_sku})
                                            IN() ;
                                        }
                                        else
                                        {
                                                IN() ;
                                        }



                                });
                            
                         }
                         function IN()
                         {
                            
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'203'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                          
                                            
                                            var  siteid="203";
                                            var  currency='INR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            IR() ;
                                                            
                                        }
                                        else
                                            {
                                                IR() ;
                                            }



                                });
                            
                         }

                         function IR()
                         {
                             
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'205'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                            
                                            var  siteid="205";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            IT() ;
                                                            
                                        }
                                        else
                                        {
                                             IT() ;
                                         }



                                });
                            
                         }

                         function IT()
                         {
                             
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'101'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                            
                                            var  siteid="101";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                            ML() ;
                                        }
                                        else
                                        {
                                            ML() ;
                                        }



                                });
                            
                         }
                        function ML()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'207'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="207";
                                            var  currency='MYR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             NL() ;
                                                            
                                        }
                                        else
                                        {
                                            NL() ;
                                        }



                                });
                            
                            
                            
                        }

            function NL()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id ,'productlist.marketplace':'146' }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="146";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             PP() ;
                                                            
                                        }
                                        else
                                        {
                                            PP() ;
                                        }



                                });
                            
                            
                            
                        }

            function PP()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'211'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                           
                                            var  siteid="211";
                                            var  currency='PHP';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             PL() ;
                                                            
                                        }
                                        else
                                        {
                                            PL() ;
                                        }



                                });
                            
                            
                            
                        }

            function PL()
                        {
                        
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id ,'productlist.marketplace':'212' }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                           
                                            var  siteid="212";
                                            var  currency='PLN';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             RU() ;
                                                            
                                        }
                                        else
                                        {
                                            RU() ;
                                        }



                                });
                            
                            
                            
                        }

            function RU()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'215'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            //var price=productdata.Russia_price;
                                           
                                            var  siteid="215";
                                            var  currency='RUB';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SGP() ;
                                                            
                                        }
                                        else
                                        {
                                            SGP() ;
                                        }



                                });
                            
                            
                            
                        }
                        function SGP()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'216'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="216";
                                            var  currency='SGD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SP() ;
                                                            
                                        }
                                        else
                                        {
                                            SP() ;
                                        }



                                });
                           
                            
                            
                        }
                        function SP()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id ,'productlist.marketplace':'186' }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="186";
                                            var  currency='EUR';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             SW() ;
                                                            
                                        }
                                        else
                                        {
                                            SW() ;
                                        }



                                });
                            
                            
                            
                        }
                   function SW()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'193'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                       
                                           
                                            var  siteid="193";
                                            var  currency='CHF';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             UK() ;
                                                            
                                        }
                                        else
                                        {
                                            UK() ;
                                        }



                                });
                            
                            
                            
                        }
                        function UK()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'3'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                           
                                           
                                            var  siteid="3";
                                            var  currency='GBP';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             US() ;
                                                            
                                        }
                                        else
                                        {
                                            US() ;
                                        }



                                });
                           
                            
                            
                        }
            function US()
                        {
                         
                                Products.find({ 'productlist.seller_sku': seller_sku,'productlist.userid':user_id,'productlist.marketplace':'0'  }, function(err, result) {
                                    if(result.length > 0)
                                        {
                                            
                                           
                                            var  siteid="0";
                                            var  currency='USD';
                                            var product_sku=seller_sku;
                                            resultdata.push({'quantity':quantity,'siteid':siteid,'currency':currency,'product_sku':product_sku})
                                             final() ;
                                                            
                                        }
                                        else
                                        {
                                            final() ;
                                        }



                                });
                            
                            
                            
                        }

                        function final()
                        {
                            console.log('in final') ;
                            next() ;
                        }

                           

            },(err,response) =>{
               //res.send(resultdata);
               //var as=[];
                                    async.eachSeries(resultdata, function (productdata, callback) {

                                        var quantity=productdata.quantity;
    var itemid=productdata.product_sku;
    var siteid=productdata.siteid;
    console.log(siteid);
var authToken='AgAAAA**AQAAAA**aAAAAA**+uReWg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GmAZCFoAydj6x9nY+seQ**b3MEAA**AAMAAA**6b8JBXjqafigc/FbBH/xL6uG1/42MzLqpnTEE0JtdwbBpuSs2WxPtbC4WVIWiUjhGafNaJ2r/a59DLzelOLfGmPKVxlEg3qJ82okXctkldZ0M5WarZ75l8vmyA1tlOsCOq56AcvwCYq15H72M1DNtUY8TEOuoAX1rJu39fY/XSDppzamK5naXAOr3DHBYmv7Y7vQbVAtKYRDDbRyMOi8E76kVtamPvadVZaWf1oQQpxzvpyFWu2d3mm5sh6X3HwzpGUtgDosZnr6c7CeZHxXofO7KbUDeJh4yMPCOVTTyU2+XDbY2krKuZtJcpSc7tfwMNNTVy6SffuZEtq9lfGQSgUGoEWVq4AmKSlyti5Kbg96lty0AYXErvABQjioOOh126Fl5IywYATcj6gGIMuLJPal2YZD4b+DYcb0UvzHl3SN+p51VFm7vooxEPtz4nNnTnvN6f0Irs4rGJUn3Z09UBTSYaqwPVbH0iV+MxgQVbyLAvoZZJHqRmqPH9Ee91q0neX2hPOpuslSKumr1ZY+kSCt/8nBz1Wa18QI2HiDRrUmfLORIhMxJDv+HjXeAADV+NohXKalCuxEGfZA1Ewk6LBS3/L60z2/9LN7zbvn74qPZ6zMkVnSairBd41OB1B7LhO7yD79Ib39A9MOn3jLbeyjJk5d/Uzcly0SMkLPl01e3KQ7eTfIPcKY+Er/hzLFLiTyZ89uY5c8sPmcCL61WetgkM26e+3ao3/5FP54gotKZ0B4OSyFKai6gSe3OcwW';
//as.push({'quantity':quantity})
//callback();
ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'ReviseItem',
            callname:'quantity',
            appId: appid,
            certId: certid,
            devId: devid,
            sandbox: true,
            siteid:siteid,
            quantity:quantity,
            token:authToken,
            itemid:itemid, 
          });
callback();
       


                              },(err,response)=>{
                              // res.send(as)
res.render('ebay_product_csv_form.ejs', {user:user, message: 'price changed successfuly' }); 
       

                              })

            })



});

 });
 });


router.post('/update_ebay_price',isLoggedIn, function(req, res) {
   /* res.send(req.body.price);*/
   var user_id = req.session.passport.user;
            

    User.findOne({ _id: user_id }).exec(function(err, user) {


                var appid = user.ebay[0].clientid;
                var certid = user.ebay[0].clientsecret;
                var devid = user.ebay[0].devid;
    var price=req.body.price;
    var itemid=req.body.itemid;
var authToken=user.ebay[0].token;
ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'ReviseItem',
            callname:'price',
            appId: appid,
            certId: certid,
            devId: devid,
            sandbox: true,
            siteid:'0',
            price:price,
            token:authToken,
            itemid:itemid,
          },
        function(error, data) {
            /*if (error) {
                res.send(error);
            } else {
                res.send('success');
            }*/
            var message='price change successfuly';
            res.redirect('edit_amazon_record_price/'+itemid);
            

            //res.render('/pages/products/edit_ebay_record_price.ejs', { message: 'Quantity changed successfuly' }); 
        });

});
    });
router.post('/update_ebay_quantity',isLoggedIn, function(req, res) {
     var user_id = req.session.passport.user;
            

    User.findOne({ _id: user_id }).exec(function(err, user) {
   /* res.send(req.body.price);*/
                var appid = user.ebay[0].clientid;
                var certid = user.ebay[0].clientsecret;
                var devid = user.ebay[0].devid;
                 var quantity=req.body.quantity;
                var itemid=req.body.itemid;
                var authToken=user.ebay[0].token;
ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'ReviseItem',
            callname:'quantity',
            appId: appid,
            certId: certid,
            devId: devid,
            sandbox: true,
            siteid:'0',
            quantity:quantity,
            token:authToken,
            itemid:itemid,
          },
        function(error, data) {
            res.render("pages/products/edit_ebay_record_price", { productsmatch: productsfind,user:req.user ,message:true});
 
            /*if (error) {
                res.send('success');
            } else {
                res.send('success');
            }*/
        });

});
    });
router.post('/ebay_api', isLoggedIn, function(req, res) {
    var Au = req.body.AU;
    var AT = req.body.AT;
    var BENL = req.body.BENL;
    var BEFR = req.body.BEFR;
    var CAFR = req.body.CAFR;
    var FR = req.body.FR;
    var DE = req.body.DE;
    var HK = req.body.HK;
    var IN = req.body.IN;
    var IE = req.body.IE;
    var IT = req.body.IT;
    var MY = req.body.MY;
    var PL = req.body.PL;
    var RU = req.body.RU;
    var SG = req.body.SG;
    var ES = req.body.ES;
    var UK = req.body.UK;
    var US = req.body.US;


//res.send(amz_cred_data);
    var region = {};
    if (Au != null) {
        region.AU = req.body.AU;
    }
    if (AT != null) {
        region.AT = req.body.AT;
    }
    if (BENL != null) {
        region.BENL = req.body.BENL;
    }
    if (BEFR != null) {
        region.BEFR = req.body.BEFR;
    }
    if (CAFR != null) {
        region.CAFR = req.body.CAFR;
    }
    if (FR != null) {
        region.FR = req.body.FR;
    }
if (DE != null) {
        region.DE = req.body.DE;
    }
    if (HK != null) {
        region.HK = req.body.HK;
    }
    if (IN != null) {
        region.IN = req.body.IN;
    }
    if (IE != null) {
        region.IE = req.body.IE;
    }
    if (IT != null) {
        region.IT = req.body.IT;
    }
    if (MY != null) {
        region.MY = req.body.MY;
    }
    
    if (PL != null) {
        region.PL = req.body.PL;
    }
    
    if (RU != null) {
        region.RU = req.body.RU;
    }
    
    if (SG != null) {
        region.SG = req.body.SG;
    }
    
    if (ES != null) {
        region.ES = req.body.ES;
    }
    if (UK != null) {
        region.UK = req.body.UK;
    }
    if (US != null) {
        region.US = req.body.US;
    }


   
   var ebayData = { clientid: req.body.clientid, devid: req.body.devid, clientsecret: req.body.clientsecret,token:req.body.token, region: region };
//res.send(ebayData);
   

    //console.log(req.session.passport.user);
    var query = req.session.passport.user;
    User.update({
        _id: query
    }, {
        ebay: ebayData
    }, {
        upsert: true
    }, function(err, result) {
        if (err) {
            return err;
        } else {
             getEbayDetail(req.session.passport.user, (err, details) => {
               //res.send(details);
                if (err)

                    res.send('Something Went Wrong')
                getebayProducts(req.session.passport.user, details, (err, result) => {
                   console.log('product');
                  // res.send(result[0].siteid[0]);
                   var productdata=result[0].data.ActiveList[0].Items;
                   var siteid=result[0].siteid[0];
                 // res.send(productdata);
                  async.eachSeries(productdata, function (singledata, callback) {
                        var sku=singledata.ItemID;
                        var open_date=singledata.ListingDetails.StartTime;
                        var quantity=singledata.Quantity;
                        var price=singledata.BuyItNowPrice.amount;
                        var userid=query;
                        
                        var item_name=singledata.Title;
                        var pending_quantity=singledata.QuantityAvailable;
                         Products.find({ 'productlist.seller_sku': sku,'productlist.userid':userid }, function(err, resultprod) {

                        if (resultprod.length > 0) {

                           Products.findByIdAndUpdate(resultprod[0]._id,{ 'productlist.seller_sku': sku,  'productlist.item_name': item_name, 'productlist.quantity': quantity,'productlist.price': price,'productlist.pending_quantity': pending_quantity,  'productlist.open_date': open_date  }, function(err, resultup) {
                               if (err) {
console.log('if');
                                    throw err;
                                } else {
console.log('else');
                                    callback(null);
                                }

                            })
                        } else {

console.log('selse');
                            var products_detail = new Products();
                            products_detail.productlist.seller_sku = sku;
                            
                            products_detail.productlist.item_name = item_name;
                            
                            products_detail.productlist.price = price;
                            products_detail.productlist.quantity = quantity;
                            products_detail.productlist.pending_quantity = pending_quantity;
                             products_detail.productlist.userid = userid;
                             products_detail.productlist.open_date = open_date;
                              products_detail.productlist.platform = 'Ebay';
                              products_detail.productlist.marketplace=siteid;
                            
                            products_detail.save(function(err, responses) {
                                if (err) {
                                    console.log(err);
                                }
                                callback(null, responses);
                            })
                        }
                    });

                   },(err,response)=>{

res.redirect('show_ebay_products');

                   });
                })
            })
        }
    });


});
router.get('/ebay_testapi', function(req, res) {

    ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetMyeBaySelling',
            appId: 'ravinder-nodeappl-SBX-0134e8f72-1416c6b1',
            certId: 'SBX-134e8f721a84-f900-44a9-bdcd-5101',
            devId: '0477b6b6-14ae-4c80-a401-1b2515985ade',
            sandbox: true,
            siteid:'0',
            authToken: 'AgAAAA**AQAAAA**aAAAAA**+uReWg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GmAZCFoAydj6x9nY+seQ**b3MEAA**AAMAAA**6b8JBXjqafigc/FbBH/xL6uG1/42MzLqpnTEE0JtdwbBpuSs2WxPtbC4WVIWiUjhGafNaJ2r/a59DLzelOLfGmPKVxlEg3qJ82okXctkldZ0M5WarZ75l8vmyA1tlOsCOq56AcvwCYq15H72M1DNtUY8TEOuoAX1rJu39fY/XSDppzamK5naXAOr3DHBYmv7Y7vQbVAtKYRDDbRyMOi8E76kVtamPvadVZaWf1oQQpxzvpyFWu2d3mm5sh6X3HwzpGUtgDosZnr6c7CeZHxXofO7KbUDeJh4yMPCOVTTyU2+XDbY2krKuZtJcpSc7tfwMNNTVy6SffuZEtq9lfGQSgUGoEWVq4AmKSlyti5Kbg96lty0AYXErvABQjioOOh126Fl5IywYATcj6gGIMuLJPal2YZD4b+DYcb0UvzHl3SN+p51VFm7vooxEPtz4nNnTnvN6f0Irs4rGJUn3Z09UBTSYaqwPVbH0iV+MxgQVbyLAvoZZJHqRmqPH9Ee91q0neX2hPOpuslSKumr1ZY+kSCt/8nBz1Wa18QI2HiDRrUmfLORIhMxJDv+HjXeAADV+NohXKalCuxEGfZA1Ewk6LBS3/L60z2/9LN7zbvn74qPZ6zMkVnSairBd41OB1B7LhO7yD79Ib39A9MOn3jLbeyjJk5d/Uzcly0SMkLPl01e3KQ7eTfIPcKY+Er/hzLFLiTyZ89uY5c8sPmcCL61WetgkM26e+3ao3/5FP54gotKZ0B4OSyFKai6gSe3OcwW',
            params: {
                ActiveList:true // FILL IN A REAL ItemID
            }

        },
        function(error, data) {
            if (error) {
                res.send(error);
            } else {
                console.log('product');
                res.send(data);
            }
        });

});
 router.get('/ebaytest', function(req, res) {

    ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'GetItem',
            appId: 'ravinder-nodeappl-SBX-0134e8f72-1416c6b1',
            certId: 'SBX-134e8f721a84-f900-44a9-bdcd-5101',
            devId: '0477b6b6-14ae-4c80-a401-1b2515985ade',
            sandbox: true,
            authToken: 'AgAAAA**AQAAAA**aAAAAA**+uReWg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GmAZCFoAydj6x9nY+seQ**b3MEAA**AAMAAA**6b8JBXjqafigc/FbBH/xL6uG1/42MzLqpnTEE0JtdwbBpuSs2WxPtbC4WVIWiUjhGafNaJ2r/a59DLzelOLfGmPKVxlEg3qJ82okXctkldZ0M5WarZ75l8vmyA1tlOsCOq56AcvwCYq15H72M1DNtUY8TEOuoAX1rJu39fY/XSDppzamK5naXAOr3DHBYmv7Y7vQbVAtKYRDDbRyMOi8E76kVtamPvadVZaWf1oQQpxzvpyFWu2d3mm5sh6X3HwzpGUtgDosZnr6c7CeZHxXofO7KbUDeJh4yMPCOVTTyU2+XDbY2krKuZtJcpSc7tfwMNNTVy6SffuZEtq9lfGQSgUGoEWVq4AmKSlyti5Kbg96lty0AYXErvABQjioOOh126Fl5IywYATcj6gGIMuLJPal2YZD4b+DYcb0UvzHl3SN+p51VFm7vooxEPtz4nNnTnvN6f0Irs4rGJUn3Z09UBTSYaqwPVbH0iV+MxgQVbyLAvoZZJHqRmqPH9Ee91q0neX2hPOpuslSKumr1ZY+kSCt/8nBz1Wa18QI2HiDRrUmfLORIhMxJDv+HjXeAADV+NohXKalCuxEGfZA1Ewk6LBS3/L60z2/9LN7zbvn74qPZ6zMkVnSairBd41OB1B7LhO7yD79Ib39A9MOn3jLbeyjJk5d/Uzcly0SMkLPl01e3KQ7eTfIPcKY+Er/hzLFLiTyZ89uY5c8sPmcCL61WetgkM26e+3ao3/5FP54gotKZ0B4OSyFKai6gSe3OcwW',
            siteid:'15',
            params: {
                'ItemID': '110258337040' // FILL IN A REAL ItemID
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
 router.get('/get_order',isLoggedIn, function(req, res) {

     var user = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: user }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('amazon_get_order.ejs', { user: user, message: true });
        }
    });

});

  router.post('/get_order', isLoggedIn,function(req, res) {

    var userid = req.session.passport.user;
User.findOne({ _id: userid }).exec(function(err, user) {
       
       var awsaccesskeyid=user.mws[0].awsaccesskeyid;
       var sellerid=user.mws[0].sellerid;
       var secretkey=user.mws[0].secretkey;
       getAmazonDetail(req.session.passport.user, (err, details) => {
                 // res.send(details);
                if (err)

                    res.send('Something Went Wrong')
                getOrders(req.session.passport.user, details, (err, result) => {
                    //res.send(result);
                    //res.redirect('show_product');
                    res.redirect('show_order');
                })
            })

       
    });
   // res.send(region);

});
  router.get('/show_order', function(req, res) {

     var user = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    Orders.find({'orderlist.userid': user }).exec(function(err, orders) {

//res.send(orders);
        if (err) {

        } else {

//res.send(orders)
            res.render("amazon_show_order.ejs", { orders: orders,user:req.user });
        }
    });

});
   router.get('/get_ebay_order',isLoggedIn, function(req, res) {

     var user = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    User.findOne({ _id: user }).exec(function(err, user) {
       // res.send(user);
        //console.log(err);
        if (err) {
            console.log("Error:");
        } else {

            res.render('ebay_get_order.ejs', { user: user, message: true });
        }
    });

});
   router.post('/get_ebay_order', isLoggedIn,function(req, res) {

    var userid = req.session.passport.user;
User.findOne({ _id: userid }).exec(function(err, user) {
   /* res.send(req.body.price);*/
                var appid = user.ebay[0].clientid;
                var certid = user.ebay[0].clientsecret;
                var devid = user.ebay[0].devid;
                
                var authToken=user.ebay[0].token;
   ebay.xmlRequest({
  serviceName : 'Trading',
  opType : 'GetOrders',

  // app/environment
  devId: devid,
  certId: certid,
  appId: appid,
  sandbox: true,
  siteid:'0',

  // per user
  authToken: authToken,
  params: {
    'OrderStatus': 'Active',
    'NumberOfDays': 1
  }
}, function(error, results) {
  res.redirect('show_ebay_order');
});
       
    });
   // res.send(region);

});
   router.get('/show_ebay_order', function(req, res) {

     var user = req.session.passport.user;
     //res.send(query);
    // console.log(query);


    Orders.find({'orderlist.userid': user }).exec(function(err, orders) {

//res.send(orders);
        if (err) {

        } else {

//res.send(orders)
            res.render("ebay_show_order.ejs", { orders: orders,user:req.user });
        }
    });

});
// rexwebsolutions.com
router.get('/test', function(req, res) {

    ebay.xmlRequest({
  serviceName : 'Trading',
  opType : 'GetOrders',

  // app/environment
  devId: '0477b6b6-14ae-4c80-a401-1b2515985ade',
  certId: 'SBX-134e8f721a84-f900-44a9-bdcd-5101',
  appId: 'ravinder-nodeappl-SBX-0134e8f72-1416c6b1',
  sandbox: true,
  siteid:'0',

  // per user
  authToken: 'AgAAAA**AQAAAA**aAAAAA**+uReWg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GmAZCFoAydj6x9nY+seQ**b3MEAA**AAMAAA**6b8JBXjqafigc/FbBH/xL6uG1/42MzLqpnTEE0JtdwbBpuSs2WxPtbC4WVIWiUjhGafNaJ2r/a59DLzelOLfGmPKVxlEg3qJ82okXctkldZ0M5WarZ75l8vmyA1tlOsCOq56AcvwCYq15H72M1DNtUY8TEOuoAX1rJu39fY/XSDppzamK5naXAOr3DHBYmv7Y7vQbVAtKYRDDbRyMOi8E76kVtamPvadVZaWf1oQQpxzvpyFWu2d3mm5sh6X3HwzpGUtgDosZnr6c7CeZHxXofO7KbUDeJh4yMPCOVTTyU2+XDbY2krKuZtJcpSc7tfwMNNTVy6SffuZEtq9lfGQSgUGoEWVq4AmKSlyti5Kbg96lty0AYXErvABQjioOOh126Fl5IywYATcj6gGIMuLJPal2YZD4b+DYcb0UvzHl3SN+p51VFm7vooxEPtz4nNnTnvN6f0Irs4rGJUn3Z09UBTSYaqwPVbH0iV+MxgQVbyLAvoZZJHqRmqPH9Ee91q0neX2hPOpuslSKumr1ZY+kSCt/8nBz1Wa18QI2HiDRrUmfLORIhMxJDv+HjXeAADV+NohXKalCuxEGfZA1Ewk6LBS3/L60z2/9LN7zbvn74qPZ6zMkVnSairBd41OB1B7LhO7yD79Ib39A9MOn3jLbeyjJk5d/Uzcly0SMkLPl01e3KQ7eTfIPcKY+Er/hzLFLiTyZ89uY5c8sPmcCL61WetgkM26e+3ao3/5FP54gotKZ0B4OSyFKai6gSe3OcwW',

  params: {
    'OrderStatus': 'Active',
    'NumberOfDays': 1
  }
}, function(error, results) {
  res.send(results);
});

});


module.exports = router; 