// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
// define the schema for our user model
var userSchema = mongoose.Schema({

    productlist: {
        item_name: String,
        item_descp: String,
        price: String,
        quantity: String,
        seller_sku: String,
        asin: String,
        pending_quantity: String,
        product_id: String,
        fulfillment_channel: String,
        merchant_shipping_group: String,
        listing_id: String,
        open_date: String,
        status: String,
        marketplace:String,
        platform:String,
        userid: {
            type: String,
            ref: 'User'

        },
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
module.exports = mongoose.model('Products', userSchema);