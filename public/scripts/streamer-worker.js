// Declare variables
var recorder;
var mediaStream;
var speechEvents = null;
var stream = null;
var max_seconds = 1.5;
var stopped_speaking_timeout;
var should_be_recording;

// Function to start recording audio
function startRecording() {
  document.getElementById('startRecord').classList.add('none');
  document.getElementById('stopRecord').classList.remove('none');

  if(stream === null) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(mediaStream) {
      stream = mediaStream;
      setupRecording();
    }).catch(function(error) {
      console.log('Error accessing user media:', error);
    });
  } else {
    setupRecording();
  }
}

function setupRecording() {
  // Create a new instance of RecordRTC
  recorder = new RecordRTC(stream, {
    type: 'audio',
    mimeType: 'audio/webm'
  });

  if (speechEvents) {
    speechEvents.stop();
  }

  // Start recording
  recorder.startRecording();

  if (robot) {
    robot.setEyes(0x00FF00);
  }

  should_be_recording = true;

  // Create a speech events instance with hark
  speechEvents = hark(stream, {});

  // Add an event listener for speech start
  speechEvents.on('speaking', function() {
    console.log('Speech started');
  });

  // Add an event listener for speech end or silence
  speechEvents.on('stopped_speaking', function() {
    stopped_speaking_timeout = setTimeout(function() {
        recorder.stopRecording(function() {
            document.getElementsByClassName('micinvert')[0].style.backgroundColor = 'red';

            // Get the recorded audio as a Blob
            var blob = recorder.getBlob();

            if (blob.size < 10 * 1024) {
              // If the size is less than 10KB, start a new recording
              restartRecording();
            } else {
              // Upload or process the recorded audio as needed
              if (robot) {
                robot.setEyes(0xFFFF00);
              }
              getSTT(blob); 
              console.log('Speech ended');
            }             

          });
    }, max_seconds * 1000);
  });
}

// Function to stop recording audio
function stopRecording() {
  document.getElementById('stopRecord').classList.add('none');
  document.getElementById('startRecord').classList.remove('none');

  if (robot) {
    robot.setEyes(0xFFFFFF);
  }

  if (recorder) {
    // Stop recording
    recorder.stopRecording(function() {
      should_be_recording = false;
    });
  }
  
  if (speechEvents) {
    speechEvents.stop();
    speechEvents = null;
  }

  // clear the timeout
  clearTimeout(stopped_speaking_timeout);
}