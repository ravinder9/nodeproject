// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
// define the schema for our user model
var userSchema = mongoose.Schema({

    orderlist: { 
        amazon_order_id: String,
        merchant_orderid: String,
        purchase_date: String,
        order_status: String,
        sales_channel: String,
        sku:String,
        asin: String,
        order_status: String,
        quantity: String,
        currency: String,
        
        userid:String
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Orders', userSchema);