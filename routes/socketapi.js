const io = require( "socket.io" )();
const socketapi = {
    io: io
};

var monitorMap = new Map();
const sio = io.of('/sio');

sio.on( "connection", function( socket ) {
    console.log( "A user connected" );
    sio.to(socket.id).emit('YourID', socket.id);
    socket.on('monitor_connect', (data) => {
        console.log(data);

        monitorMap.set(socket.id, {
            status: 'online',
            target_id: data.target_id,
            my_id: socket.id
        })
    })

    socket.on( 'message', (data) => {
        console.log(data);
        monitorMap.forEach((map) => {
            if(map.target_id == socket.id) {
                console.log('sending data to: ' + map.my_id)
                sio.to(map.my_id).emit('message', data);
            }
        });
    });
});


module.exports = socketapi;