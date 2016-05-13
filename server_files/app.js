// Libraries
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', function(client) {
    
    client.on('join', function(name) {
        client.nickname = name;
    });
    
    client.on('messages', function(data) {
        console.log(data);
        var nickname = client.nickname;
        client.broadcast.emit('messages', `${nickname}: ${data}`);
        client.emit('messages', `${nickname}: ${data}`);
    });
    
});

app.get('/', function(request, response) {
    response.sendFile('/home/ubuntu/workspace/index.html');
    
});

server.listen(process.env.PORT, function() {
    console.log('Server Ready');
});

