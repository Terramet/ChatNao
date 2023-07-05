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
      this.subscriber = null;
      this.robotType = 'ROS';
    }
  
    setEyes(colour) {
      console.log(`This method is not available for ROS robots: setEyes(${colour})`);
    }
  
    say(message) {
      // Implement speech synthesis for ROS based robot
      const m = new ROSLIB.Message({
        data: message // Set the string data field of the message
      });
  
      if (this.publisher) {
        this.publisher.publish(m);
      } else {
        console.error('Publisher is not defined.');
      }
    }
  
    connect() {
      // Implement connection for ROS based robot
      console.log(`ROS Robot connecting to: ${this._ip}`);
  
      const ros = new ROSLIB.Ros({
        url: `ws://${this._ip}:9090` // URL of the ROS master
      });
  
      ros.on('connection', () => {
        console.log('Connected to ROS');
        this.publisher = new ROSLIB.Topic({
          ros: ros,
          name: this.topic,
          messageType: 'std_msgs/String'
        });

        this.subcriber = new ROSLIB.Topic({
          ros: ros,
          name: this.topic,
          messageType: 'std_msgs/String'
        });
      });
  
      ros.on('error', (error) => {
        console.error('Error connecting to ROS:', error);
      });
  
      ros.on('close', () => {
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
        this.robotType = 'NAO'
    }

    async say(message, callback) {
        // this._speechDoneCallback = callback;  // Store callback for later use

        this.setEyes(0xFF0000);

        try {
            // Implement speech synthesis for Nao/Pepper robot
            this._session.service("ALAnimatedSpeech").then(async (tts) => {
                await tts.say(message);
                
                setTimeout(() => {
                    this.setEyes(0x00FF00);
                    callback();
                }, 1 * 1000);
            });
        } catch (err) {
            console.log('Error running say')
        }
        
    }

    setEyes(colour) {
        this._session.service("ALLeds").then( (led) => {
            led.fadeRGB('FaceLeds', colour, 0.1);
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

    sendImage() {
        this._session.service('ALTabletService').then( tS => {
            var imageUrl = `${window.location.href}uploads/file.jpeg`;
            var cacheBuster = `?v=${new Date().getTime()}`
            tS.showImage(imageUrl + cacheBuster);
        });
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
            } else {
                console.log('Tablet module is not available!');
            }

            this.session = session;

            addToChat("Nao", "Nao has connected");

            session.service("ALRobotPosture").then(alrp => {
                alrp.goToPosture('Stand', 1.0);
            })

            session.service("ALBackgroundMovement").then((bm) => {
                bm.setEnabled(true);
                bm.isEnabled().then( a => {
                    console.log(a);
                });
                console.log("ALBackgroundMovement service started");
            }).catch((error) => {
                console.error('Error:', error);
            });

            session.service("ALBasicAwareness").then((ba) => {
                ba.setEnabled(true);
                ba.isEnabled().then( a => {
                    console.log(a);
                });
                console.log("ALBasicAwareness service started");
            }).catch((error) => {
                console.error('Error:', error);
            });

        }, () => {
            console.log("disconnected")
        }, host);
    }
}