/*In production (heroku) the connection has to be made to:
 ** https://freecodecamp-edmonton-chatroom.herokuapp.com/
 ** not to: https://my-chat-app-ferbarra2207.c9users.io/ if you are using cloud 9.
 ** If running locally on your machine set it to http://localhost:"whatever port being use"
*/

var socket = io.connect('https://my-chat-app-ferbarra2207.c9users.io/');
//var socket = io.connect('https://uselesschat.herokuapp.com/');
            
socket.on('connect', function(data) {
    var nickname = prompt('Choose a nickname');
    socket.emit('join', nickname);
});
            
socket.on('update users list', function(newUser) {
    $(`<li>${newUser}</li>`).appendTo('#users > ul');
});
            
socket.on('remove user', function(user) {
    //remove the users name from the users window
    console.log("Someone disconnected");
});
            
socket.on('user removed', function(user) {
    //$(`#active-users li[data-name=${user}]`).remove();
    $(`<p><strong>${user} has left the chat.</strong></p>`).appendTo('#messages');
});
            
socket.on('user joined', function(newUserMessage) {
    $(`<p><strong>${newUserMessage}</strong></p>`).appendTo('#messages');
});
            
socket.on('messages', function(data) {
    $(`<p>${data}</p>`).appendTo('#messages');
});

socket.on('notify disconnection', function(data) {
    alert('You have been disconnected');
});
            
$(document).ready(function() {
    $('form').submit(function(e) {
        e.preventDefault();
        var message = $('#message').val();
                    
        if (typeof message === 'string' && message !== '') {
            socket.emit('messages', message);
            $('#message').val('');
        }
    });
            
});
