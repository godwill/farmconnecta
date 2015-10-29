var express = require('express'),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    ejs = require('ejs'),
    router = express.Router(),
    request = require('request'),
    _ = require('underscore'),
    moment = require('moment'),
    thinky = require('./../config/thinky.js'),
    r = thinky.r,
    type = thinky.type,
    Listing = require('./../models/Listing'),
    Farmer = require('./../models/Farmer'),
    orangeAPI = require('./../controllers/orange'),
    secrets = require('./../secrets/secrets'),
    Pusher = require('pusher'),
    passwordless = require('passwordless'),
    RethinkDBStore = require('passwordless-rethinkdbstore');


var pusher = new Pusher({
    appId: secrets.pusher.app_id,
    key:  secrets.pusher.key,
    secret:  secrets.pusher.secret,
    encrypted: true
});

pusher.port = 443;


/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'FarmConnecta' });
});

router.post('/orange/smsdr', function(req, res, next) {
    console.log("Request: ", req.body);
    console.log("Response: ", res);
    next();
});

router.get('/orange/smsdr', function(req, res, next) {
    console.log("Request: ", req.body);
    console.log("Response: ", res);
    next();
});

router.get('/orange/ussd', function(req, res, next) {
    console.log("Request: ", req.body);
    //console.log("Response: ", res);
    res.sendFile(path.join(__dirname, '../views/ussd', 'index.html'));
});

router.get('/orange/ussd/subscribe', function(req, res, next) {
    var data = {
        senderAddress: req.headers['user-msisdn'],
        messageId: req.headers['activityid']
    };
    orangeAPI.chargeUser(data);
});

router.get('/orange/ussd/matimela', function(req, res, next) {
    var number = req.headers['user-msisdn'].substr(7);

    var farmer = new Farmer({
        number: number,
        brand: req.query.response
    });

    farmer.save().then(function(result){

        console.log(result);
        res.sendFile(path.join(__dirname, '../orange/ussd', 'end.html'));

    }).error(function(err){
        console.log({message: err});
    });

});

var ejs2html = function (path, information) {
    fs.readFile(path, 'utf8', function (err, data) {
        if (err) { console.log(err); return false; }
        var ejs_string = data,
            template = ejs.compile(ejs_string),
            html = template(information);
        fs.writeFile(path + '.html', html, function(err) {
            if(err) { console.log(err); return false }
            return true;
        });
    });
};


router.get('/orange/ussd/listings', function(req, res, next) {
    ejs2html(path.join(__dirname, '../views/' , 'listings.ejs'));
});

router.post('/orange/smsmo', function(req, res, next) {

    var data = req.body.inboundSMSMessageNotification.inboundSMSMessage;

    var listing = new Listing({
        sender: data.senderAddress,
        destination: data.destinationAddress,
        messageId: data.messageId,
        message: data.message
    });

    if(_.isEmpty(data) === false){

        var subscribe = 'subscribe';

        if(data.message.toUpperCase() === subscribe.toUpperCase()){

            console.log("Going in, the message contains ", data.message);

            orangeAPI.chargeUser(data);

        }

        if(data.message.toUpperCase() !== subscribe.toUpperCase()){

            console.log("Going in, the message does not contains ", data.message);

            listing.save().then(function(result){

                pusher.trigger('sms_channel', 'new_sms', {
                    result: result
                });

                console.log(result);
                res.status(200)
                    .send({ success: true}
                );

            }).error(function(err){
                console.log({message: err});
            });
        }
    }

    next();

});

router.get('/listings',
    function(req, res, next) {

        var listings;

        r.table("Listing").orderBy(r.desc('date')).run().then(function(listings){
            res.render('listings', {'listings': listings, 'moment' : moment});
        }).error(function(err){
            console.log(err);
            return res.json({message: err}).status(401);
        });
    });

router.get('/farmers',
    function(req, res, next) {

        var farmers;

        r.table("Farmer").orderBy(r.desc('dateCreated')).run().then(function(farmers){
            res.json(farmers);
            //res.render('listings', {'listings': fa, 'moment' : moment});
        }).error(function(err){
            console.log(err);
            return res.json({message: err}).status(401);
        });
    });

router.get('/api/listings', function(req, res, next) {

    r.table("Listing").orderBy(r.desc('date')).run().then(function(listings){
        return res.json(listings);
    }).error(function(err){
        return res.json({message: err}).status(401);
    });

});

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});

router.get('/about', function(req, res) {
    res.render('about', { title: 'About' });
});

router.get('/logout',
    passwordless.logout(),
    function(req, res) {
        res.redirect('/');
    });


module.exports = router;