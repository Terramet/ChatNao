var context = [{"role": "system", "content": "You are a humanoid robot called Pepper. You are not an AI language model"}]
var max_messages = 10;  // change this to adjust the number of messages to keep
var num_messages = 0;

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
          robot.say(data[0]);
        } else {
          getTTS(data[0]);
        }
      }
  })
}

function restartRecording() {
  console.log('restarting recording called.')
   if (recorder && should_be_recording) { 
    recorder.startRecording(); 
  } 
}

function sendGPT(msg) {
  var msgs = {};
  msgs.content = msg;
  msgs.role = 'user';
  context.push(msgs);

  // Update message count, ignoring 'system' role
  if (msgs.role !== 'system') num_messages++;

  $.ajax({
    type: 'POST',
    data: JSON.stringify(context),
    contentType: 'application/json',
    url: removeHASH() + 'chatgpt/send',
    success: (data) => {
      console.log(data);
      manageMessage('ChatGPT', data)
      let newRes = {}
      newRes.content = data;
      newRes.role = 'assistant';
      context.push(newRes);

      // Update message count, ignoring 'system' role
      if (newRes.role !== 'system') num_messages++;

      // If the message count exceeds the limit
      if (num_messages > max_messages) {
        // Keep removing the first 'user' or 'assistant' message until the count is within limit
        while (num_messages > max_messages) {
          if (context[0].role !== 'system') {
            context.shift();  // remove the oldest message
            num_messages--;
          } else {
            // If the oldest message is a 'system' message, remove the next one
            if (context[1].role !== 'system') {
              context.splice(1, 1);  // remove the second oldest message
              num_messages--;
            }
          }
        }
      }

      if (robot != null) {
        robot.say(data, restartRecording);
      } else {
        getTTS(data, restartRecording);
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

function getTTS(text, callback) {
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
        console.log(data)
        playFile(data, callback)
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
          sendGPT(data);
        }
      }
  })
}

function importAudio() {
  data = {}
  data.filenameAudio = '/home/nao/recordings/microphones/audio.wav'
  data.endDirAudio = './public/raw_audio/';
  data.ip = robot.ip
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

function playFile(filename, callback) {
  $.ajax({
    type: 'GET',
    contentType: 'application/json',
    url: removeHASH() + 'files/' + filename,
    success: (data) => {
      console.log(data);
      let audio = new Audio(data);
      audio.addEventListener('ended', function() {
        console.log('Audio playback finished');
        callback()
      });
      audio.play();
    }
  })
}