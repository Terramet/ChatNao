socket = baseSocketIO.connect({transports: ['websocket']});
var your_id = null

socket.on('YourID', (id) => {
    // Handle the received message, e.g., display it on the screen
    console.log('Received message:', id);
    your_id = id
    const query = window.location.search;
    const params = new URLSearchParams(query);
    socket.emit('monitor_connect', { target_id: params.get('ws') });
});

socket.on('message', (data) => {
    console.log(data)
    manageMessage(data.user, data.msg)
});

function socketSend(data) {
    socket.emit('message', data);
}