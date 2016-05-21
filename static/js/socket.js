var socket = io.connect('https://my-chat-app-ferbarra2207.c9users.io/');
            
socket.on('connect', function(data) {
    var nickname = prompt('Choose a nickname');
    socket.emit('join', nickname);
    });
            
socket.on('display users', function(newUser) {
    console.log(`New user: ${newUser}`);
});
            
socket.on('remove user', function(user) {
                
    //$(`#active-users li[data-name=${user}]`).remove();
});
            
socket.on('user removed', function(user) {
    $(`<p><strong>${user} has left the chat.</strong></p>`).appendTo('#messages-conntainer');
});
            
socket.on('chat', function(newUserMessage) {
    $(`<p><strong>${newUserMessage}</strong></p>`).appendTo('#messages-container');
});
            
socket.on('messages', function(data) {
    $(`<p>${data}</p>`).appendTo('#messages-container');
    console.log(data);
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
                
    $('#clear-screen').on('click', function() {
        $('#messages-container').html('');
    });
});
