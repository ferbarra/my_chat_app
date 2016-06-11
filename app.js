// Libraries & frameworks
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var io = require('socket.io')(server);


//Setting up redis connection
const redis = require('redis');
const TESTING_DB = 0;
const DEVELOPMENT_DB = 1;
const PRODUCTION_DB = 2;

if (process.env.REDISTOGO_URL) {
    var rtg = require("url").parse(process.env.REDISTOGO_URL);
    var redisClient = redis.createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
    var redisClient = redis.createClient();
    redisClient.select( process.env.NODE_ENV || DEVELOPMENT_DB);
}


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

