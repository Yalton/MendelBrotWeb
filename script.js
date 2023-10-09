// script.js

let scene, camera, renderer;
let canvas, loadingText, errorText;
let socket;
let fragmentShader, mandelbrotMaterial, mandelbrotMesh;
let zoomLevel = 1.0;
let dataTexture;  // Define dataTexture
canvas = document.getElementById("canvas");

// Initialize the dataTexture
dataTexture = new THREE.DataTexture(new Uint8Array(), 1, 1, THREE.RGBAFormat);
dataTexture.needsUpdate = true;


function init(fragmentShader, vertexShader) {
  console.log("Init function called.");
  console.log("Vertex Shader:", vertexShader.substring(0, 100));
  console.log("Fragment Shader:", fragmentShader.substring(0, 100));

  // Create loading and error text elements
  loadingText = document.createElement("div");
  loadingText.id = "loading";
  loadingText.innerText = "Loading...";
  canvas.appendChild(loadingText);

  errorText = document.createElement("div");
  errorText.id = "error";
  errorText.style.display = "none";
  canvas.appendChild(errorText);

  // Create the scene
  scene = new THREE.Scene();

  // Create the camera
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  mandelbrotMaterial = new THREE.ShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },  // New line
      zoomLevel: { value: zoomLevel },
      dataTexture: { value: dataTexture },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });


  console.log("Shader Material Created:", mandelbrotMaterial);
  const gl = renderer.getContext();


  mandelbrotMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mandelbrotMaterial);
  scene.add(mandelbrotMesh);

  console.log('Scene:', scene);
  console.log('Camera:', camera);

  // Start the animation loop
  animate();




  // let vertShader = gl.createShader(gl.VERTEX_SHADER);
  // gl.shaderSource(vertShader, vertexShader);
  // gl.compileShader(vertShader);
  // if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
  //   console.error("VERTEX SHADER COMPILE ERROR: ", gl.getShaderInfoLog(vertShader));
  // }

  // let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(fragShader, fragmentShader);
  // gl.compileShader(fragShader);
  // if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
  //   console.error("FRAGMENT SHADER COMPILE ERROR: ", gl.getShaderInfoLog(fragShader));
  // }
  // Create the Mandelbrot mesh

}

function animate() {
  mandelbrotMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height); // New line
  requestAnimationFrame(animate);
  mandelbrotMaterial.uniforms.zoomLevel.value = zoomLevel;
  mandelbrotMaterial.uniforms.dataTexture.value = dataTexture;
  dataTexture.needsUpdate = true;  // Mark the texture for update
  renderer.render(scene, camera);
  zoomLevel += 0.01;  // Small increments
  updateZoomLevel(zoomLevel)
}



// Event listener for mouse wheel zoom
// canvas.addEventListener("wheel", function (event) {
//   event.preventDefault();

//   // Calculate the new zoom level
//   const delta = Math.sign(event.deltaY);
//   zoomLevel *= Math.pow(1.1, delta);

//   // Clamp the zoom level
//   zoomLevel = Math.max(0.0001, zoomLevel);

//   // Update the zoom level in the backend
//   updateZoomLevel(zoomLevel);
// }, { passive: true });

async function loadShader(url) {
  console.log(`Attempting to load shader from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader: ${url}`);
  }
  const text = await response.text();
  console.log(`Loaded shader: ${text.substring(0, 100)}...`);
  return text;
}

// Event listener for window resize
window.addEventListener("resize", function () {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Function to update the zoom level in the backend
function updateZoomLevel(zoomLevel) {
  // Send the zoom level to the backend using websockets
  // ...
}

// Function to handle errors
function handleError(message) {
  errorText.innerText = message;
  errorText.style.display = "block";
}

function handleData(data) {
  const canvasWidth = canvas.width; // get canvas width
  const canvasHeight = canvas.height; // get canvas height

  dataTexture.image = {
    data: new Uint8Array(data),
    width: canvasWidth,  // Updated
    height: canvasHeight,  // Updated
  };


  dataTexture.format = THREE.RGBAFormat;
  dataTexture.type = THREE.UnsignedByteType;
  dataTexture.needsUpdate = true;

  // Update the uniform
  mandelbrotMaterial.uniforms.dataTexture.value = dataTexture;
  mandelbrotMaterial.uniforms.dataTexture.needsUpdate = true;

  console.log('Updating Texture:', dataTexture);
}



// Function to handle loading completion
function handleLoadingComplete() {
  loadingText.style.display = "none";
}

// websockets
// socket.addEventListener('open', function (event) {
//   console.log('WebSocket connection established');
//   requestZoomData(0);
// });


// socket.addEventListener('message', function (event) {
//   const data = JSON.parse(event.data);
//   if (data.hasOwnProperty('zoomLevel')) { // Check if zoomLevel is present
//     zoomLevel = data.zoomLevel;
//   }
//   console.log('Received data from backend:', data);
//   handleData(data);  // Replace 'someArray' with whatever your actual data field is.
// });


// Send a message to the backend to request data for a specific zoom level
function requestZoomData(zoomLevel) {
  const message = JSON.stringify({
    zoomLevel: zoomLevel
  });
  socket.send(message);

  // Update the zoom level in the frontend
  updateZoomLevel(zoomLevel);
}

async function main() {
  try {
    console.log("Main function called");
    const [fragmentShader, vertexShader] = await Promise.all([
      loadShader('fragmentShader.frag'),
      loadShader('vertex.vert'),
    ]);
    console.log("Shaders loaded, initializing...");
    init(fragmentShader, vertexShader);
  } catch (error) {
    console.error(error);
    handleError('Failed to load shaders.');
  }
}

document.addEventListener("DOMContentLoaded", function () {
  main();

  // Initialize WebSocket connection here
  socket = new WebSocket('ws://localhost:9001');

  socket.addEventListener('open', function (event) {
    console.log('WebSocket connection established');
    requestZoomData(0);
  });

  socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    if (data.hasOwnProperty('zoomLevel')) {
      zoomLevel = data.zoomLevel;
    }
    console.log('Received data from backend:', data);
    handleData(data);
  });
});
