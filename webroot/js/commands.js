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
        // pass numbers as numbers
        var fld = frm.find("input[name=" + field.name + "]");
        var fldType = fld.attr("type");

        if (fldType == "number") {
            settings[field.name] = parseFloat(field.value);    
        } else {
            // everything else as a string
            settings[field.name] = field.value;
        }
        
    });
    sendCommand(settings, 'settings');
}