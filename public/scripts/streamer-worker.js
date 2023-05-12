// Declare variables
var recorder;
var mediaStream;
var speechEvents;
var max_seconds = 1;
var stopped_speaking_timeout;
var should_be_recording;

// Function to start recording audio
function startRecording() {
  document.getElementById('startRecord').classList.add('none');
  document.getElementById('stopRecord').classList.remove('none');
  // Request user media for audio
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      // Store the media stream
      mediaStream = stream;

      // Create a new instance of RecordRTC
      recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm'
      });

      // Start recording
      recorder.startRecording();
      should_be_recording = true;

      // Create a speech events instance with hark
      speechEvents = hark(stream, {});

      // Add an event listener for speech start
      speechEvents.on('speaking', function() {
        console.log('Speech started');
      });

      // Add an event listener for speech end or silence
      speechEvents.on('stopped_speaking', function() {
        console.log('Speech ended');
        stopped_speaking_timeout = setTimeout(function() {
            recorder.stopRecording(function() {
                // Get the recorded audio as a Blob
                var blob = recorder.getBlob();
          
                // Upload or process the recorded audio as needed
                getSTT(blob);              
              });
        }, max_seconds * 1000);
      });
    })
    .catch(function(error) {
      console.log('Error accessing user media:', error);
    });
}

// Function to stop recording audio
function stopRecording() {
  document.getElementById('stopRecord').classList.add('none');
  document.getElementById('startRecord').classList.remove('none');
  if (recorder) {
    // Stop recording
    recorder.stopRecording(function() {
      should_be_recording = false;

      // Release the media stream resources
      mediaStream.getTracks().forEach(function(track) {
        track.stop();
      });
    });
  }
}