var robot = null;
var mediaStream = null;
var recorder = null;
var audioBuffer = [];
var context = null;
var rec = null;

function addToChatSelf(data=null) {
  if (data == null) {
    sendGPT(document.getElementById("textToSay").value);
  } else {
    sendGPT(data);
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

function addToChat(user, text) {
  var ele = document.createElement("li");
  ele.classList.add("other");

  var div = document.createElement("div");
  div.classList.add("msg");

  var divUser = document.createElement("div");
  divUser.classList.add("user");
  divUser.innerHTML += user;

  var pText = document.createElement("p");
  pText.innerText += text;

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
