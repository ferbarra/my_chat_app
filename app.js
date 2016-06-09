// Libraries & frameworks
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(server);
const redis = require('redis');
const redisClient = redis.createClient();

var storeMessage = function (name, data) {
    var message = JSON.stringify({name: name, data: data});
    redisClient.lpush('messages', message, function(error, reply) {
        redisClient.ltrim('messages', 0, 9);
    });
};

io.on('connection', function(socket) {
    
    socket.on('join', function(name) {
        socket.nickname = name;
        socket.broadcast.emit('display users', name);
        redisClient.smembers('users', function(error, users) {
            users.forEach(function(user) {
                socket.emit('display users', user);
            });
        });
        
        redisClient.sadd('users', name);
        
        socket.broadcast.emit('chat', `${name} joined the chat`);
        
        redisClient.lrange("messages", 0, -1, function(error, messages) {
            messages = messages.reverse();
            messages.forEach(function(message) {
                message = JSON.parse(message);
                socket.emit('messages', `${message.name}: ${message.data}`);
            });
        });
        
    });
    
    socket.on('messages', function(data) {
        console.log(data);
        
        var nickname = socket.nickname;
        
        socket.broadcast.emit('messages', `${nickname}: ${data}`);
        socket.emit('messages', `${nickname}: ${data}`);
        storeMessage(nickname, data);
    });
    
    socket.on('disconnect', function(user) {
        var nickname = socket.nickname;
        console.log(user);
        socket.broadcast.emit('user removed', socket.nickname);
        socket.broadcast.emit('remove user', user);
        redisClient.srem('users', socket.nickname);
    });
    
    
});

app.use(express.static('public'));

server.listen(process.env.PORT, function() {
    console.log('Server Ready');
});

