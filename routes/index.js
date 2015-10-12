var express = require('express'),
    util = require('util'),
    router = express.Router(),
    _ = require('underscore'),
    thinky = require('./../config/thinky.js'),
    r = thinky.r,
    type = thinky.type,
    Listing = require('./../models/Listing');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FarmConnecta' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/orange/smsmo', function(req, res, next) {

    var data = req.body.inboundSMSMessageNotification.inboundSMSMessage;

    var listing = new Listing({
        sender: data.senderAddress,
        destination: data.destinationAddress,
        date: data.dateTime,
        messageId: data.messageId,
        message: data.message
    });


    if(_.isEmpty(data) === false){
        listing.save().then(function(result){
            console.log(result);
            res.status(200)
                .send({ success: true}
            );

        }).error(function(err){
            console.log({message: err});
        });
    }else{
        res.json({message: error});
    }
});

router.get('/logout', function(req, res, next) {
	console.log("I am being probed");
    next();
});

module.exports = router;
