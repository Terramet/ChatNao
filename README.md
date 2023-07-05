# ChatNao

This is a chat application built with Node.js and integrated with IBM Watson Assistant. It allows users to have interactive conversations with a chatbot powered by OpenAI's GPT-3.5 Turbo model. The chat messages are exchanged in real-time using web sockets.

## Features

- Real-time chat with a chatbot powered by GPT-3.5 Turbo
- Integration with IBM Watson Assistant for additional chat functionality
- Text-to-speech and speech-to-text capabilities using IBM Watson services
- Integration with robots to allow real time conversations for HRI
- Provides microphone access to use speech rather than the chat interface.

## Prerequisites

Before running the application, ensure that you have the following prerequisites installed:

- Node.js (Gallium)
- IBM Watson Assistant API key and credentials
- IBM Watson Text-to-Speech and Speech-to-Text API keys and credentials
- OpenAI API key

## Installation

1. Clone the repository:

    ```
    git clone https://github.com/Terramet/ChatNao.git
    ```

2. Install the dependencies:

    ```
    cd ChatNao
    npm install
    ```

    Create a HTTPS cert and key:
    ```
    openssl req -new -key server.key -out server.crt
    ```

3. Configure the application:
    Create a file in root directory called api.json and place in your api keys it should look like the following: 

    ```
    {
        "AssistantV1": "key",
        "TextToSpeech": "key",
        "SpeechToText": "key",
        "OpenAI": "key"
    }
    ```

4. Start the server:
    ```
    npm start
    ```

5. Access the application:

    Open your web browser and navigate to http://localhost:8080 to access the chat application.
    Open your web browser and navigate to https://localhost:8443 to access the chat application via https.

6. Connect to your robot:

    In the top right of the webpage there is a connect button that will allow you to select what kind of robot you have.
    In the case of Nao/Pepper, all you have to do is enter the robots IP Address and it should pop up in chat with "Nao has connected"
    In the case of a ROS robot, you will need to type in the IP of your robot and also the topic that allows fo text to speech, such as /speech/say