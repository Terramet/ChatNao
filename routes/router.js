require('dotenv').config();
var express = require('express');
var router = express.Router();
var Client = require('ssh2-sftp-client');
const fs = require('fs');
const multer = require('multer');
const AssistantV1 = require('ibm-watson/assistant/v1');
const TextToSpeech = require('ibm-watson/text-to-speech/v1');
const SpeechToText = require('ibm-watson/speech-to-text/v1');
const {
    IamAuthenticator
} = require('ibm-watson/auth');
const apiKeys = require('../api.json')
const axios = require('axios');
const socketapi = require('./socketapi')
const ffmpeg = require('fluent-ffmpeg');

async function messageAsyncGPT(conversation) {
    var data = {
        'model': 'gpt-4o-mini',
        'messages': conversation,
    };

    var options = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKeys.OpenAI,
            'content-type': 'application/json'
        },
        data: JSON.stringify(data),
        url: 'https://api.openai.com/v1/chat/completions',
    };

    return axios(options);
}

const upload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, './uploads');
        },
        filename: function(req, file, callback) {
            callback(null, 'file.' + file.fieldname);
        }
    })
})

const assistant = new AssistantV1({
    authenticator: new IamAuthenticator({
        apikey: apiKeys.AssistantV1
    }),
    version: '2018-09-20',
    url: 'https://api.eu-gb.assistant.watson.cloud.ibm.com'
})

const tts = new TextToSpeech({
    authenticator: new IamAuthenticator({
        apikey: apiKeys.TextToSpeech
    }),
    url: 'https://api.eu-gb.text-to-speech.watson.cloud.ibm.com'
})

const stt = new SpeechToText({
    authenticator: new IamAuthenticator({
        apikey: apiKeys.SpeechToText
    }),
    url: 'https://api.eu-gb.speech-to-text.watson.cloud.ibm.com',
    headers: {
        'X-Watson-Learning-Opt-Out': 'true'
    }
});

const messageAsync = function(text, context) {
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

router.get('/', function(req, res) {
    res.render('gpt_chat');
});

router.get('/monitor', function(req, res) {
    res.render('gpt_chat_monitor');
});

router.post('/', function(req, res) {
    res.send('POST route on router.');
});

router.post('/watson/send', function(req, res) {
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

router.post('/watson/tts', function(req, res) {
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
            let file_path = 'public/tts/speech.wav';
            fs.writeFileSync(file_path, repairedFile);
            console.log(file_path + ' written with a corrected wav header');
            return file_path;
        })
        .then(file_path => {
            res.send(file_path.replace('public/', ''));
        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/watson/stt/ws', function(req, res) {
  var transcription = '';
  console.log(req.body)
  // Create the stream.
  const recognizeStream = stt.recognizeUsingWebSocket({
      content_type: 'audio/wav',
      interimResults: false
  });

  recognizeStream.on('data', function(chunk) {
      console.log(chunk.toString());
      transcription += chunk.toString(); // Append the transcribed data
  });

  recognizeStream.on('end', function() {
      console.log('Streaming ended');
      res.send(transcription); // Send the response once streaming is complete
  });

  recognizeStream.on('error', function(e) {
      console.log(e);
      res.status(500).send('Error occurred during speech-to-text processing');
  });

  // Pipe in the audio.
  const fileStream = fs.createReadStream(`${req.body.outputFile}`);
  fileStream.pipe(recognizeStream);

  // Listen for the 'end' event on the fileStream and then end the recognizeStream
  fileStream.on('end', () => {
      recognizeStream.end();
  });
});

//export this router to use in our index.js
module.exports = router;

router.post('/trimAudio', upload.single('webm'), function(req, res) {
    let inputFile = `./uploads/${req.file.filename}`;
    let convertedFile = `./uploads/converted.wav`;
    let outputFile = `./uploads/trimmed.wav`;

    ffmpeg(inputFile)
        .output(convertedFile)
        .format('wav')
        .on('end', function() {
            console.log('Conversion finished !');
            ffmpeg(convertedFile)
                .audioFilter(`silenceremove=stop_periods=-1:stop_threshold=-50dB:stop_duration=0.72:window=0`)
                .on('error', function(err) {
                    console.log('An error occurred: ' + err.message);
                    res.status(500).json({ error: 'An error occurred during conversion: ' + err.message });
                })
                .on('end', function() {
                    console.log('Trimming finished !');
                    fs.unlinkSync(convertedFile); // delete the trimmed flac file
                    res.json({ message: 'Processing finished!', outputFile: outputFile });
                  })
                .save(outputFile);  
        })
        .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
            res.status(500).json({ error: 'An error occurred during conversion: ' + err.message });
        })
        .run();
});



router.post('/watson/stt', function(req, res) {
    // Specify the audio file path for conversion
    const audioFile = './public/raw_audio/audio.wav';

    // Create a ReadableStream from the audio file
    const audioStream = fs.createReadStream(audioFile);

    // Configure the parameters for the speech recognition
    const recognizeParams = {
        audio: audioStream,
        contentType: 'audio/wav',
        model: 'en-US_BroadbandModel', // Change the model as per your requirements
    };

    stt.recognize(recognizeParams)
        .then(response => {
            const transcription = response.result.results.map(result => result.alternatives[0].transcript).join(' ');
            console.log('Transcription:', transcription);
            res.send(transcription)
        })
        .catch(err => {
            console.log('Error:', err);
        });
});

router.post('/chatgpt/send', function(req, res) {
    console.log(req.body);
    messageAsyncGPT(req.body)
        .then(response => {

            console.log(response.data, '\n--------');

            return response.data.choices[0].message.content;
        }).then(data => {
            res.send(data);
        });
});

router.post('/ssh/copy_recordings_audio', function(req, res, next) {
    try {
        let responseSent = false; // Flag to track if response has been sent

        fs.unlinkSync(req.body.endDirAudio + 'audio.wav');

        fs.watchFile(req.body.endDirAudio, function() {
            if (!responseSent) {
                fs.unwatchFile(req.body.endDirAudio);
                responseSent = true; // Set the flag to true after sending the response
                res.send(req.body.endDirAudio + 'audio.wav');
            }
        });

        console.log(req.body)

        let sftp = new Client();
        sftp.connect({
                host: req.body.ip,
                port: 22,
                user: 'nao',
                tryKeyboard: true,
            })
            .then(() => {
                return sftp.fastGet(req.body.filenameAudio, req.body.endDirAudio + 'audio.wav');
            })
            .then((data) => {
                console.log(data);
                sftp.end();
            })
            .catch((err) => {
                console.log(err, 'catch error');
            });
        sftp
            .on('keyboard-interactive', function(name, instructions, lang, prompts, finish) {
                console.log('Connection :: keyboard');
                finish([req.body.robotPass]);
            });

        sftp
            .on('error', function(e) {
                console.log(e);
                res.status(111);
                res.send(e);
            });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, req.params.filename);
    console.log(filePath);
    res.sendFile(filePath);
});

router.post('/saveImage', upload.single('jpeg'), function(req, res, next) {
    console.log(req.file.filename)
    if (req.file) {
        console.log('Image saved successfully');
        res.status(200).send('Image saved successfully');
    } else {
        console.error('Error saving image');
        res.status(500).send('Error');
    }
});

//export this router to use in our index.js
module.exports = router;