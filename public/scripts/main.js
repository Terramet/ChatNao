var robot = null;
var context = null;
var mediaStream = null;
var recorder = null;
var audioBuffer = [];
var context = null;
var rec = null;

const handleSuccess = function(stream) {
  console.log('handleSuccess')
  context = new AudioContext();
  mediaStream = context.createMediaStreamSource(stream);
  recorder = context.createScriptProcessor(1024, 1, 1);

  mediaStream.connect(recorder);
  recorder.connect(context.destination);

  recorder.onaudioprocess = function(e) {
    // Do something with the data, e.g. convert it to WAV
    audioBuffer.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
    // const options = {mimeType: 'audio/webm'};
    // const recordedChunks = [];
    // const mediaRecorder = new MediaRecorder(stream, options);
    //
    // mediaRecorder.addEventListener('dataavailable', function(e) {
    //   if (e.data.size > 0) {
    //     recordedChunks.push(e.data);
    //   }
    //
    //   if(shouldStop === true && stopped === false) {
    //     mediaRecorder.stop();
    //     stopped = true;
    //   }
    // });
    //
    // mediaRecorder.addEventListener('stop', function() {
    //   console.log('Sending request to server');
    //   getSTT(new Blob(recordedChunks));
    // });
    //
    // mediaRecorder.start();
}

function addToChatSelf(data=null) {
  if (data == null) {
    sendWatson(document.getElementById("textToSay").value);
  } else {
    sendWatson(data);
  }
  var ele = document.createElement("li");
  ele.classList.add("self");

  var div = document.createElement("div");
  div.classList.add("msg");

  var pText = document.createElement("p");
  if (data == null) {
    pText.innerHTML += document.getElementById("textToSay").value;
  } else {
    pText.innerHTML += data;
  }
  document.getElementById("textToSay").value = '';

  var time = document.createElement("time");
  var d = new Date();
  var n = d.getTime();

  time.innerHTML =+ d.getHours() + ":"  + d.getMinutes();

  div.appendChild(pText);
  div.appendChild(time);
  ele.appendChild(div);
  var win = document.getElementById("msgs");

  win.appendChild(ele);
}

function addToChatWatson(text) {
  var ele = document.createElement("li");
  ele.classList.add("other");

  var div = document.createElement("div");
  div.classList.add("msg");

  var divUser = document.createElement("div");
  divUser.classList.add("user");
  divUser.innerHTML += "Watson";

  var pText = document.createElement("p");
  pText.innerHTML += text;

  var time = document.createElement("time");
  var d = new Date();
  var n = d.getTime();

  time.innerHTML =+ d.getHours() + ":"  + d.getMinutes();


  div.appendChild(divUser);
  div.appendChild(pText);
  div.appendChild(time);
  ele.appendChild(div);
  var win = document.getElementById("msgs");

  win.appendChild(ele);
}

function connected(session) {
  console.log("connected");
  addToChatSelf("connected");
  robot = {
    value: '',
    say() {
      console.log(this.response);
      session.service("ALTextToSpeech").then((tts) => {
        tts.say(this.response);
      });
    },
    get response() {
      return this.value;
    },
    set response(value) {
      this.value = value;
      this.say();
    }
  }
}

function disconnected() {
  console.log("disconnected");
}

function connectNao() {
  let host = document.getElementById('ip').value;
  host += ":80"
  QiSession(function(session) {
    connected(session);
  }, disconnected, host);
}

function beginAudioStreamX() {
  var session = {
    audio: true,
    video: false,
  }
  var recordRTC = null;
  document.getElementById('startRecord').classList.add('none');
  document.getElementById('stopRecord').classList.remove('none');
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleSuccess);
}

function endAudioStreamX() {
  document.getElementById('stopRecord').classList.add('none');
  document.getElementById('startRecord').classList.remove('none');
  recorder.disconnect(context.destination);
  mediaStream.disconnect(recorder);
  getSTT(new Blob([audioBuffer], { type: 'audio/wav; codecs=MS_PCM' }));
}

function beginAudioStream() {
  document.getElementById('startRecord').classList.add('none');
  document.getElementById('stopRecord').classList.remove('none');
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        context = new AudioContext();
        var source = context.createMediaStreamSource(stream);
        rec = new Recorder(source);
        rec.record();
      });
}

function endAudioStream() {
  document.getElementById('stopRecord').classList.add('none');
  document.getElementById('startRecord').classList.remove('none');
  rec.stop()
  var blob = rec.exportWAV(getSTT)
}

function onError(e) {
  console.log(e);
}

function convertFloat32ToInt16(buffer) {
  l = buffer.length
  buf = new Int16Array(l)
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff
  }
  return buf.buffer
}
