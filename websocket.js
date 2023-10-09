// // websocket.js

// // Establish a WebSocket connection
// const socket = new WebSocket('ws://localhost:9001');

// socket.addEventListener('open', function (event) {
//     console.log('WebSocket connection established');
//     requestZoomData(0);
// });


// socket.addEventListener('message', function (event) {
//     const data = JSON.parse(event.data);
//     if(data.hasOwnProperty('zoomLevel')) { // Check if zoomLevel is present
//         zoomLevel = data.zoomLevel;
//     }
//     console.log('Received data from backend:', data);
//     handleData(data);  // Replace 'someArray' with whatever your actual data field is.

// });


// // Send a message to the backend to request data for a specific zoom level
// function requestZoomData(zoomLevel) {
//     const message = JSON.stringify({
//       zoomLevel: zoomLevel
//     });
//     socket.send(message);
  
//     // Update the zoom level in the frontend
//     updateZoomLevel(zoomLevel);
//   }