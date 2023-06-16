socket = baseSocketIO.connect({transports: ['websocket']});
var your_id = null

socket.on('YourID', (id) => {
    // Handle the received message, e.g., display it on the screen
    console.log('Received message:', id);
    your_id = id
});

function socketSend(data) {
    console.log(`emitting data: ${data}`)
    socket.emit('message', data);
}