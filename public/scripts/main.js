// Declare variables
var robot;
var mediaStream;
var recorder;
var audioBuffer = [];
var context;
var rec;
var workletNode;

function addToChatSelf(data) {
    // Create the elements for the message
    var ele = document.createElement("li");
    ele.classList.add("self");
  
    var div = document.createElement("div");
    div.classList.add("msg");
  
    var pText = document.createElement("p");

    pText.innerHTML += data;

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

function connectNao() {
  let host = document.getElementById('ip').value;
  robot = new NaoPepperRobot(host)
}

function connectROS() {
  let host = document.getElementById('ip').value;
  let topic = document.getElementById('topic').value;
  robot = new ROSBasedRobot(host, topic)
}

// Function to scroll to the bottom of the chat window
function scrollToBottom() {
  setTimeout(() => {
    const chat = $('#msgs');
    chat.animate({ scrollTop: chat.prop('scrollHeight')}, 500);
  }, 100);
}

function manageMessage(user, data) {
  if (document.getElementById('msgs').scrollHeight > document.getElementById('msgs').clientHeight) {
    document.getElementById('msgs').innerHTML = '';
  }
  if (user == 'self') {
    addToChatSelf(data);
  } else {
    addToChat(user, data);
  }
  scrollToBottom();
  //socketSend({'user': user, 'msg': data});
  if (robot) {
    if (robot.robotType == 'NAO') {
      updateTablet();
    }
  }
}

function updateTablet() {
  domtoimage.toBlob(document.getElementById('msgs'),  {height: document.getElementById('msgs').scrollHeight}).then(blob => {
        var formData = new FormData();
        formData.append('jpeg', blob); // append blob to formData with filename
    
        $.ajax({
          type: 'POST',
          url: '/saveImage',  // Replace with your server endpoint
          data: formData,
          contentType: false,
          processData: false,
          success: function(data) {
            console.log('Image uploaded successfully');
            robot.sendImage();
          },
          error: function(error) {
            console.error('Error uploading image:', error);
          }
        });
      }, 'image/jpeg');
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
