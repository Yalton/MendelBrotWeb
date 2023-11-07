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

socket = new WebSocket('ws://127.0.0.1:9001');
socket.binaryType = 'arraybuffer'; // To handle binary data if you decide to use that


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

}

socket.onmessage = function(event) {
  const data = new Uint8Array(event.data);
  handleData(data);
};

socket.onerror = function(error) {
  console.error('WebSocket Error:', error);
};

function animate() {
  requestAnimationFrame(animate);
  mandelbrotMaterial.uniforms.zoomLevel.value = zoomLevel;
  dataTexture.needsUpdate = true;  // Mark the texture for update
  renderer.render(scene, camera);
  zoomLevel += 0.001; // Implement appropriate zoom control here
}

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

window.addEventListener("resize", function () {
  if (renderer) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    mandelbrotMaterial.uniforms.resolution.value.set(width, height);
  }
});

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
