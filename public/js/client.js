//console.log("client.js loaded");
$(document).ready(function() {
    
    $('#users-button').on('click', function() {
        $('#chat-window').hide(0, function() {
            $('#users-window').show();
        });
    });
    
    $('#chat-button').on('click', function() {
        $('#users-window').hide(0, function() {
            $('#chat-window').show();
        });
    });
    
});