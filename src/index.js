var APP_ID = "amzn1.ask.skill.bdbbc785-e5de-4297-9232-f5a0df1aea31"; 
var AlexaSkill = require('./AlexaSkill');
var https = require('https');
var YodaTranslatorSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
YodaTranslatorSkill.prototype = Object.create(AlexaSkill.prototype);
YodaTranslatorSkill.prototype.constructor = YodaTranslatorSkill;

YodaTranslatorSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the Yoda Translator. With the YodaTranslator, Alexa will read back a sentence the way Yoda would say it. Now, what sentence would you like to translate?";
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

function getYodaSays(sentence, callback) {
    if (!sentence) {
        callback(null, "Error!");
        return;
    }
    sentence = sentence.replace(/ /g, "+");
    var options =  {
        hostname: 'yoda.p.mashape.com',
        path: '//' + "yoda?sentence=" + sentence,
        method: 'GET',
        headers: {
            "Accept": "text/plain",
            "X-Mashape-Key": "3WON87zfcfmshacvLrCuViaSTBqzp1ot056jsnvTUKFr30fMb8"
        }
    };
    var req = https.request(options, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            console.log("Got result!");
            callback(body, null);
        });
    }).on('error', function (e) {
        callback(null, e);
    });
    req.on('socket', function (socket) {
        socket.setTimeout(12000);  
        socket.on('timeout', function() {
            req.abort();
        });
    });
    req.end();
}

YodaTranslatorSkill.prototype.intentHandlers = {

    "GetTranslationIntent": function (intent, session, response) {
       var stringSlot = intent.slots.string,
            string;
       if (stringSlot && stringSlot.value){
            string = stringSlot.value;
        }
        var cardTitle = "Translation for " + string;
        getYodaSays(string, function(result, error) {
            var speechOutput,repromptOutput;
            if (result && !(JSON.stringify(result).includes("<"))) {
                speechOutput = {
                    speech: result,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.tellWithCard(speechOutput, cardTitle, result);
                console.log(speechOutput);
            } else {    //weren't able to translate
                var speech;
                if (string) {
                    speech = "Sorry, I can't translate " + string;
                } else {
                    speech = "Sorry, get that I did not.";
                }
                speechOutput = {
                    speech: speech,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                repromptOutput = {
                    speech: "What else can I help with?",
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.ask(speechOutput, repromptOutput);
                console.log(speechOutput);
            }
        });
            
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With the YodaTranslator, Alexa will read back a sentence the way Yoda would say it. Now, what sentence would you like to translate?";
        var repromptText = "What would you like to translate?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

exports.handler = function (event, context) {
    var skill = new YodaTranslatorSkill();
    skill.execute(event, context);
};