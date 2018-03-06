var user = require('../../models/user')

export function getUserDetail(userId,callback){
    user.findById(userId, function (err, user){
        if(err)
         callback(err)
        callback(null,user)
      });
}

export function getAmazonDetail(userId,callback){
    user.findById(userId, function (err, user){
        if(err)
         callback(err)
        callback(null,user.mws)
      });
}

export function getEbayDetail(userId,callback){
    user.findById(userId, function (err, user){
        if(err)
         callback(err)
        callback(null,user.ebay)
      });
}