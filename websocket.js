// websocket.js

// Establish a WebSocket connection
const socket = new WebSocket('ws://localhost:3000');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('WebSocket connection established');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    console.log('Received data from backend:', data);
    zoomLevel = data.zoomLevel; // Assume backend sends new zoomLevel
});


// Send a message to the backend to request data for a specific zoom level
function requestZoomData(zoomLevel) {
    const message = JSON.stringify({
        zoomLevel: zoomLevel
    });
    socket.send(message);
}

// Example usage: request data for zoom level 10
requestZoomData(10);
