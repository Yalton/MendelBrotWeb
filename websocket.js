// websocket.js

// Establish a WebSocket connection
const socket = new WebSocket('ws://localhost:3000');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('WebSocket connection established');
});

// Listen for messages
socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    console.log('Received data from backend:', data);
    // Process the received data and continue rendering
});

// Send a message to the backend to request data for a specific zoom level
function requestZoomData(zoomLevel) {
    const message = {
        zoomLevel: zoomLevel
    };
    socket.send(JSON.stringify(message));
}

// Example usage: request data for zoom level 10
requestZoomData(10);
