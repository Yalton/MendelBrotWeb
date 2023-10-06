// script.js

// Global variables
let scene, camera, renderer;
let canvas, loadingText, errorText;
let mandelbrotShader, mandelbrotMaterial, mandelbrotMesh;
let zoomLevel = 1.0;


// Initialize the scene
function init() {
  // Get the canvas element
  canvas = document.getElementById("canvas");

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

  // Load the Mandelbrot shader
  mandelbrotShader = document.getElementById("mandelbrotShader").textContent;

  // Create the Mandelbrot material
  mandelbrotMaterial = new THREE.ShaderMaterial({
    uniforms: {
      zoomLevel: { value: zoomLevel },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: mandelbrotShader,
  });

  // Create the Mandelbrot mesh
  mandelbrotMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mandelbrotMaterial);
  scene.add(mandelbrotMesh);

  // Start the animation loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  mandelbrotMaterial.uniforms.zoomLevel.value = zoomLevel;  // This zoomLevel is updated via WebSocket
  renderer.render(scene, camera);
}


// Event listener for window resize
window.addEventListener("resize", function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Event listener for mouse wheel zoom
canvas.addEventListener("wheel", function (event) {
  event.preventDefault();

  // Calculate the new zoom level
  const delta = Math.sign(event.deltaY);
  zoomLevel *= Math.pow(1.1, delta);

  // Clamp the zoom level
  zoomLevel = Math.max(0.0001, zoomLevel);

  // Update the zoom level in the backend
  updateZoomLevel(zoomLevel);
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

// Function to handle successful data retrieval
function handleData(data) {
  // Update the Mandelbrot mesh with the new data
  // ...
}

// Function to handle loading completion
function handleLoadingComplete() {
  loadingText.style.display = "none";
}

// Initialize the script
init();
