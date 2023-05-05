function connected(session) {
  addToChat("Nao","Nao has connected");
  const audioModule = session.service('ALAudioDevice');

  // Register a touch event handler for the head front touch
  session.service("ALMemory").then(function (ALMemory) {
    ALMemory.subscriber("FrontTactilTouched").then(function (subscriber) {
      // subscriber.signal is a signal associated to "FrontTactilTouched"
      subscriber.signal.connect(function (state) {
        if (state === 1.0) {
          // Head front touch is detected, start recording audio
          robot.beginAudioStream();
        } else {
          // Head front touch is released, stop recording audio
          robot.endAudioStream();
        }
      });
    });
  });

  robot = {
    ip: '',
    value: '',
    beginAudioStream(){
      document.getElementById('startRecord').classList.add('none');
      document.getElementById('stopRecord').classList.remove('none');
      audioModule.then(function (audio) {
        audio.startMicrophonesRecording('/home/nao/recordings/microphones/audio.wav');
        console.log('Recording audio...');
      }).catch(function (error) {
        console.error('Error:', error);
      });
    },
    endAudioStream(){
      document.getElementById('stopRecord').classList.add('none');
      document.getElementById('startRecord').classList.remove('none');
      audioModule.then(function (audio) {
        audio.stopMicrophonesRecording();
        console.log('Stopped recording audio.');
      }).catch(function (error) {
        console.error('Error:', error);
      });

      importAudio();
    },
    say() {
      session.service("ALTextToSpeech").then((tts) => {
        tts.say(this.value);
      });
    },
    get response() {
      return this.value;
    },
    set response(value) {
      this.value = value;
      this.say();
    },
    get iAddr() {
      return this.ip
    },
    set iAddr(ip) {
      this.ip = ip
    }
  }
}

function disconnected() {
  console.log("disconnected");
}

function connectNao() {
  let host = document.getElementById('ip').value;
  let xh = host
  host += ":80"
  QiSession(function(session) {
    connected(session);
    let audioModule = session.service('ALAudioDevice');

    // Check if the audio module is available
    if (audioModule) {
      console.log('Audio module is available!');
    } else {
      console.log('Audio module is not available!');
    }

    robot.iAddr = xh

    }, disconnected, host);
}
    