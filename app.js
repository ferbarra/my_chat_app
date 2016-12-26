// Libraries & frameworks
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var io = require('socket.io')(server);


//Setting up redis connection
const redis = require('redis');

// How to connect to redis when hosted on heroku.
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
        // Adds the name to the redis list 'users'.
        redisClient.sadd('users', name);
        // The name is displayed in the active user list of all active users.
        socket.broadcast.emit('update active users list', name);
        // Gets all of the active user names and displays it on the user screen.
        redisClient.smembers('users', function(error, users) {
            users.forEach(function(user) {
                socket.emit('update active users list', user);
            });
        });
        
        //Saves the "user joined message" into the messages redisdb
        storeMessage('', `${name} joined the chat.`);
        
        // Sends all previously stored messages to the client to be displayed.
        redisClient.lrange("messages", 0, -1, function(error, messages) {
            messages = messages.reverse();
            messages.forEach(function(message) {
                message = JSON.parse(message);
                // if there name attribute is empty then it's not a user
                // message a "user joined" or "user" left message
                if (message.name === '') {
                    socket.emit('messages', `<strong>${message.data}</strong>`);
                } else {
                    socket.emit('messages', `<strong>${message.name}</strong>: ${message.data}`);
                }
            });
        });
        
        // Displays the new user joined message in every users' screen.
        socket.broadcast.emit('user joined', `${name} joined the chat.`);
        
    });
    
    socket.on('messages', function(data) {
        var nickname = socket.nickname;
        var message = `<strong>${nickname}</strong>: ${data}`;
        console.log(message)
        socket.broadcast.emit('messages', message);
        socket.emit('messages', message);
        storeMessage(nickname, data);
    });
    
    socket.on('disconnect', function(user) {
        var nickname = socket.nickname;
        var userLeftMessage = `${nickname} has left the chat.`;
        socket.emit('notify disconnection', nickname);
        socket.broadcast.emit('remove user', nickname, userLeftMessage);
        redisClient.srem('users', nickname);
        storeMessage('', userLeftMessage);
    });
    
    
});

app.use(express.static('public'));

var port = process.env.PORT || 8080;

server.listen(port, function() {
    console.log(`Server Ready...listening on port: ${port}`);
});

