// Libraries & frameworks
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var io = require('socket.io')(server);


//Setting up redis connection
const redis = require('redis');

if (process.env.REDISTOGO_URL) {
    var rtg = require("url").parse(process.env.REDISTOGO_URL);
    var redisClient = redis.createClient(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
} else {
    var redisClient = redis.createClient();
}


function storeMessage (name, data) {
    var message = JSON.stringify({name: name, data: data});
    redisClient.lpush('messages', message, function(error, reply) {
        redisClient.ltrim('messages', 0, 9);
    });
};



io.on('connection', function(socket) {
    
    // Activates when someone joins
    socket.on('join', function(name) {
        socket.nickname = name;
        // Adds the name to the list of users
        redisClient.sadd('users', name);
        // The name is displayed in the active user list of all active users.
        socket.broadcast.emit('update users list', name);
        // Gets all of the active user names and displays it on the user screen.
        redisClient.smembers('users', function(error, users) {
            users.forEach(function(user) {
                socket.emit('display users', user);
            });
        });
        
        socket.broadcast.emit('user joined', `${name} joined the chat`);
        
        redisClient.lrange("messages", 0, -1, function(error, messages) {
            messages = messages.reverse();
            messages.forEach(function(message) {
                message = JSON.parse(message);
                socket.emit('messages', `<strong>${message.name}</strong>: ${message.data}`);
            });
        });
        
    });
    
    socket.on('messages', function(data) {
        console.log(data);
        var nickname = socket.nickname;
        socket.broadcast.emit('messages', `<strong>${nickname}</strong>: ${data}`);
        socket.emit('messages', `<strong>${nickname}</strong>: ${data}`);
        storeMessage(nickname, data);
    });
    
    socket.on('disconnect', function(user) {
        var nickname = socket.nickname;
        console.log(user);
        console.log(nickname);
        socket.emit('notify disconnection', nickname);
        socket.broadcast.emit('user removed', nickname);
        socket.broadcast.emit('remove user', user);
        redisClient.srem('users', nickname);
    });
    
    
});

app.use(express.static('public'));

var port = process.env.PORT || 8080;

server.listen(port, function() {
    console.log(`Server Ready...listening on port: ${port}`);
});

