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
        addToChatWatson(data[0]);
        if (robot != null) {
          robot.response = data[0];
        } else {
          getTTS(data[0]);
        }
      }
  })
}

function getSTT(blob) {
  let fd = new FormData();
  fd.append('wav', blob);
  $.ajax({
      type: 'POST',
      url: 'watson/stt',
      data: fd,
      contentType: false,
      processData: false,
      success: (data) => {
        console.log(data);
        addToChatSelf(data);
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
        new Audio("../tts/audio.wav").play();
      }
  })
}
