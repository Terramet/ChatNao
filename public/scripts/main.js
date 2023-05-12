// Declare variables
var robot;
var mediaStream;
var recorder;
var audioBuffer = [];
var context;
var rec;
var workletNode;

// Function to add a message from the user to the chat interface
function addToChatSelf(data = null) {
  // Check if data is provided, otherwise get input from a text field
  if (data == null) {
    sendGPT(document.getElementById("textToSay").value);
  } else {
    sendGPT(data);
  }

  // Create the elements for the message
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

  // Append the elements to the chat interface
  div.appendChild(pText);
  div.appendChild(time);
  ele.appendChild(div);
  var win = document.getElementById("msgs");
  win.appendChild(ele);
}

// Function to add a message from another user to the chat interface
function addToChat(user, text) {
  // Create the elements for the message
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

  // Append the elements to the chat interface
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
  //start recording using the audio recording API
  audioRecorder.start()
  .then(() => { //on success
      console.log("Recording Audio...")    
  })    
  .catch(error => {
    // Handle the error
    console.log("Error occurred during audio recording:", error);
  });
}

function endAudioStream() {
  document.getElementById('stopRecord').classList.add('none');
  document.getElementById('startRecord').classList.remove('none');
    //stop the recording using the audio recording API
    console.log("Stopping Audio Recording...")
    audioRecorder.stop()
    .then(audioAsblob => { //stopping makes promise resolves to the blob file of the recorded audio
        console.log("stopped with audio Blob:", audioAsblob);

        getSTT(audioAsblob);
    })
    .catch(error => {
        //Error handling structure
        switch (error.name) {
            case 'InvalidStateError': //error from the MediaRecorder.stop
                console.log("An InvalidStateError has occured.");
                break;
            default:
                console.log("An error occured with the error name " + error.name);
        };

    });
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
