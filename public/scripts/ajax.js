var context = [{"role": "system", "content": "You are a small humanoid robot called Nao."}]

function removeHASH() {
  if (window.location.href.indexOf('#') != -1)
    return window.location.href.substring(0, window.location.href.indexOf('#'));
  else {
    return window.location.href;
  }
}

function sendWatson(msg) {
  var msgs = {};
  msgs.message = msg;
  $.ajax({
      type: 'POST',
      data: JSON.stringify(msgs),
      contentType: 'application/json',
      url: removeHASH() + 'watson/send',
      success: (data) => {
        console.log(data);
        addToChat('Watson', data[0]);
        if (robot != null) {
          robot.response = data[0];
        } else {
          getTTS(data[0]);
        }
      }
  })
}

function sendGPT(msg) {
  var msgs = {};
  msgs.content = msg;
  msgs.role = 'user';
  context.push(msgs);
  $.ajax({
      type: 'POST',
      data: JSON.stringify(context),
      contentType: 'application/json',
      url: removeHASH() + 'chatgpt/send',
      success: (data) => {
        console.log(data);
        addToChat('ChatGPT', data);
        let newRes = {}
        newRes.content = data;
        newRes.role = 'assistant';
        context.push(newRes);
        if (robot != null) {
          robot.response = data;
        } else {
          getTTS(data);
        }
      }
  })
}

function getSTTNaoVer(wav) {
  data = {}
  data.filenameAudio = wav
  $.ajax({
      type: 'POST',
      url: 'watson/stt',
      data: JSON.stringify(data),
      contentType: false,
      processData: false,
      success: (data) => {
        console.log(data);
        if (data != '') {
          addToChatSelf(data);
        }
      }
  })
}

function getTTS(text) {
  var chat_response = {};
  chat_response.text = text;
  chat_response.voice = 'en-US_AllisonVoice';
  console.log(text);
  $.ajax({
      type: 'POST',
      data: JSON.stringify(chat_response),
      contentType: 'application/json',
      url: removeHASH() + 'watson/tts',
      success: (data) => {
        let audio = new Audio(data);
        audio.addEventListener('ended', function() {
          console.log('Audio playback finished');
          if (recorder && should_be_recording) {
            recorder.startRecording();
          }
        });
        audio.play();
    }
  })
}

function getSTT(blob) {
  let fd = new FormData();
  fd.append('webm', blob);
  $.ajax({
      type: 'POST',
      url: 'watson/stt/ws',
      data: fd,
      contentType: false,
      processData: false,
      success: (data) => {
        console.log(data);
        if (data != '') {
          addToChatSelf(data);
        }
      }
  })
}

function importAudio() {
  data = {}
  data.filenameAudio = '/home/nao/recordings/microphones/audio.wav'
  data.endDirAudio = './public/raw_audio/';
  data.ip = robot.iAddr
  data.robotPass = 'nao'
  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: removeHASH() + 'ssh/copy_recordings_audio',
    success: (data) => {
      console.log(data);
      getSTTNaoVer(data)
    }
  })
}