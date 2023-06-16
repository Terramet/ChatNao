// Robot class definition
class Robot {
    constructor(ip) {
        this._ip = ip;
    }

    get ip() {
        return this._ip;
    }

    set ip(value) {
        this._ip = value;
    }

    say(message) {
        throw new Error('This method must be overridden by subclass');
    }

    connect() {
        throw new Error('This method must be overridden by subclass');
    }
}

// ROSBasedRobot class definition
class ROSBasedRobot extends Robot {
    constructor(ip, topic) {
        super(ip);
        this.connect(ip);
        this.topic = topic;
        this.publisher = null;
    }

    say(message) {
        // Implement speech synthesis for ROS based robot
        console.log(`ROS Robot says (via some specific method): ${message}`);
    }

    connect() {
        // Implement connection for ROS based robot
        console.log(`ROS Robot connecting to: ${this._ip}`);

        const ros = new ROSLIB.Ros({
            url: `ws://${this._ip}:9090` // URL of the ROS master
          });
          
          ros.on('connection', function() {
            console.log('Connected to ROS');
            this.publisher = new ROSLIB.Topic({
                ros: ros,
                name: this.topic,
                messageType: 'std_msgs/String'
              });
          });
          
          ros.on('error', function(error) {
            console.error('Error connecting to ROS:', error);
          });
          
          ros.on('close', function() {
            console.log('Connection to ROS closed');
          });
    }
}

// NaoPepperRobot class definition
class NaoPepperRobot extends Robot {
    constructor(ip) {
        super(ip);
        this.connect(ip);
        this._session = null;
        this._recorder = null;
        this._speechDoneCallback = null;
    }

    say(message, callback) {
        this._speechDoneCallback = callback;  // Store callback for later use

        // Implement speech synthesis for Nao/Pepper robot
        this._session.service("ALAnimatedSpeech").then((tts) => {
            tts.say(message);
        });
    }

    /**
     * @param {any} recorder
     */
    set recorder(recorder) {
        this._recorder = recorder
    }

    /**
     * @param {any} session
     */
    set session(session) {
        this._session = session
    }

    beginAudioStream(audioModule) {
        document.getElementById('startRecord').classList.add('none');
        document.getElementById('stopRecord').classList.remove('none');
        audioModule.then(function(audio) {
            audio.startMicrophonesRecording('/home/nao/recordings/microphones/audio.wav');
            console.log('Recording audio...');
        }).catch(function(error) {
            console.error('Error:', error);
        });
    }

    endAudioStream(audioModule) {
        document.getElementById('stopRecord').classList.add('none');
        document.getElementById('startRecord').classList.remove('none');
        audioModule.then(function(audio) {
            audio.stopMicrophonesRecording();
            console.log('Stopped recording audio.');
        }).catch(function(error) {
            console.error('Error:', error);
        });
        importAudio();
    }

    connect(host) {
        // Implement connection for Nao/Pepper robot
        host += ":80"
        
        QiSession((session) => {
            const audioModule = session.service('ALAudioDevice');
            const tabletService = session.service('ALTabletService');

            // Check if the audio module is available
            if (audioModule) {
                console.log('Audio module is available!');
            } else {
                console.log('Audio module is not available!');
            }

            // Check if the tablet module is available, thus we are running on pepper
            if (tabletService) {
                console.log('Tablet module is available!');
                session.service('ALTabletService').then(function (tS) {
                    tS.showWebview(window.location.href + '/monitor/?ws=' + your_id)
                });
            } else {
                console.log('Tablet module is not available!');
            }

            this.session = session;

            addToChat("Nao", "Nao has connected");

            this._session.service("ALMemory").then((ALMemory) => {
                ALMemory.subscriber("ALTextToSpeech/TextDone").then((subscriber) => {
                    // subscriber.signal is a signal associated to "TextDone"
                    subscriber.signal.connect((state) => {
                        if (state && this._speechDoneCallback) {
                            // When 'TextDone' event is triggered, invoke the callback
                            this._speechDoneCallback();
                            this._speechDoneCallback = null;  // Clear the callback after use
                        }
                    });
                });
            });

            // Register a touch event handler for the head front touch
            session.service("ALMemory").then((ALMemory) => {
                ALMemory.subscriber("FrontTactilTouched").then((subscriber) => {
                    // subscriber.signal is a signal associated to "FrontTactilTouched"
                    subscriber.signal.connect((state) => {
                        if (state === 1.0) {
                            // Head front touch is detected, start recording audio
                            this.beginAudioStream(audioModule);
                        } else {
                            // Head front touch is released, stop recording audio
                            this.endAudioStream(audioModule);
                        }
                    });
                });
            });

        }, () => {
            console.log("disconnected")
        }, host);
    }
}