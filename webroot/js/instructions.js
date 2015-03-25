"use strict"

// send any instructions
function sendInstruction(instruction) {
    client.publish('/instructions', {instruction: instruction});
}

