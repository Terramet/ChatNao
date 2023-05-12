var audioRecorder = {
  audioBlobs: [],
  mediaRecorder: null,
  streamBeingCaptured: null,
  start: function() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      return Promise.reject(new Error('mediaDevices API or getUserMedia method is not supported in this browser.'));
    } else {
      return navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioRecorder.streamBeingCaptured = stream;

          audioRecorder.mediaRecorder = new MediaRecorder(stream);
          audioRecorder.audioBlobs = [];

          audioRecorder.mediaRecorder.addEventListener('dataavailable', event => {
            audioRecorder.audioBlobs.push(event.data);
          });

          audioRecorder.mediaRecorder.start();
        });
    }
  },
  stop: function() {
    return new Promise(resolve => {
      audioRecorder.mediaRecorder.addEventListener('stop', () => {
        // Create a single Blob object with WAV format
        let audioBlob = new Blob(audioRecorder.audioBlobs, { type: 'audio/webm' });
        resolve(audioBlob);
      });

      audioRecorder.mediaRecorder.stop();
      audioRecorder.stopStream();
      audioRecorder.resetRecordingProperties();
    });
  },
  stopStream: function() {
    audioRecorder.streamBeingCaptured.getTracks()
      .forEach(track => track.stop());
  },
  resetRecordingProperties: function() {
    audioRecorder.mediaRecorder = null;
    audioRecorder.streamBeingCaptured = null;
  },
  cancel: function() {
    console.log('Cancel is not implemented.');
  }
};