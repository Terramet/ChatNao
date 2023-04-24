require('dotenv').config();
var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');
const AssistantV1 = require('ibm-watson/assistant/v1');
const TextToSpeech = require('ibm-watson/text-to-speech/v1');
const SpeechToText = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator }  = require('ibm-watson/auth');

const upload = multer({storage: multer.diskStorage({
    destination: function (req, file, callback) { callback(null, './uploads');},
    filename: function (req, file, callback) { callback(null, Date.now() + '.' + file.fieldname);}})
})

var type = upload.single('wav');

const assistant = new AssistantV1({
  authenticator: new IamAuthenticator({ apikey: '5LEpOdMr0im7Lupso2GUTwHNmAveKOuoA6KV7a0HOaWv' }),
  version: '2018-09-20',
  url: 'https://api.eu-gb.assistant.watson.cloud.ibm.com'
})

const tts = new TextToSpeech({
  authenticator: new IamAuthenticator({ apikey: 'eqAfaL95r7dBdEtSItI2-jBLxDYjykJR5nZAblwG0dQc' }),
  url: 'https://api.eu-gb.text-to-speech.watson.cloud.ibm.com'
})

const stt = new SpeechToText({
  authenticator: new IamAuthenticator({ apikey: '8xSMvG79LsyZCc62BS8wb7QR1iGbUJAedo9Dj6eZylCt' }),
  url: 'https://api.eu-gb.speech-to-text.watson.cloud.ibm.com',
  headers: {
    'X-Watson-Learning-Opt-Out': 'true'
  }
});

const messageAsync = function (text, context) {
  const payload = {
    workspaceId: 'dcc5438c-9612-43d6-b84e-76f4e32eebfa',
    input: {
      text: text,
    },
    context: context,
  };
    return assistant.message(payload);
};

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

router.get('/', function(req, res){
   res.render('watson_chat');
});
router.post('/', function(req, res){
   res.send('POST route on router.');
});

router.post('/watson/send', function(req, res){
  console.log(req.body);
  messageAsync(req.body.message, undefined)
    .then(response1 => {
      // APPLICATION-SPECIFIC CODE TO PROCESS THE DATA
      // FROM ASSISTANT SERVICE
      console.log(JSON.stringify(response1.result, null, 2), '\n--------');

      // invoke a second call to assistant
      return response1.result;
    }).then(data => {
      res.send(data.output.text);
    })
});

router.post('/watson/tts', function(req, res){
  console.log(req.body)
  const params = {
    text: req.body.text,
    voice: req.body.voice, // Optional voice
    accept: 'audio/wav'
  };

  tts.synthesize(params)
    .then(response => {
      const audio = response.result;
      return tts.repairWavHeaderStream(audio);
    })
    .then(repairedFile => {
      let file_path = 'public/tts/audio.wav';
      fs.writeFileSync(file_path, repairedFile);
      console.log('audio.wav written with a corrected wav header');
      return file_path;
    })
    .then(file_path =>
    {
      res.send(file_path);
    })
    .catch(err => {
      console.log(err);
    });
});

router.post('/watson/stt', upload.single('wav'), function(req, res){
  // Create the stream.
  const recognizeStream = stt.recognizeUsingWebSocket({
    content_type: 'audio/wav',
    interimResults: true
  });

  recognizeStream.on('data', function(chunk) {
    console.log(chunk.toString());
    res.send(chunk.toString());
  });
  recognizeStream.on('error', function(e) {
    console.log(e);
  });

  // Pipe in the audio.
  fs.createReadStream('./uploads/' + req.file.filename).pipe(recognizeStream);
});

//export this router to use in our index.js
module.exports = router;
