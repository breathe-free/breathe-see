"use strict"

// send any commands
function sendCommand(command, commandType) {
    // commandType defaults to 'command'

    commandType = typeof commandType !== 'undefined' ? commandType : 'command';
    client.publish('/commands', {
        command:     command,
        commandType: commandType
    });
}

var frm = $('#settings');
function saveSettings() {
    //serialise the form and send
    var settings = {};
    $.each(frm.serializeArray(), function( i, field ) {
        console.log(frm.find("input[name=" + field.name + "]").attr("type"));
        if (frm.find("input[name=" + field.name + "]").attr("type") == "number") {
            settings[field.name] = parseFloat(field.value);    
        } else {
            settings[field.name] = field.value;
        }
        
    });
    sendCommand(settings, 'settings');
}