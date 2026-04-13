// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

  //GLOBALS
  let canvas;
  let gl;
  let a_Position;
  let u_FragColor;
  let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
   canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
   gl = getWebGLContext(canvas);
   gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals for UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; 
let g_selectedSize = 10.0;
let g_selectedSegments = 12;
let g_selectedType = 'POINT';
let g_showManualPicture = false;

function addActionsForHtmlUI() {
    //Button Events
  document.getElementById('Green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('Red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('ClearButton').onclick = function() { g_shapesList = []; RenderAllShapes(); };

  document.getElementById('pointButton').onclick = function() { g_selectedType = 'POINT'; };
  document.getElementById('triButton').onclick = function() { g_selectedType = 'TRIANGLE'; };
  document.getElementById('circleButton').onclick = function() { g_selectedType = 'CIRCLE'; };
  document.getElementById('drawMyPictureButton').onclick = function() {
    g_showManualPicture = true;
    RenderAllShapes();
  };
  document.getElementById('toggleReferenceButton').onclick = function() {
    toggleReferenceImage();
  };

    //Slider Events
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; });

    //Size Slider Event
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value; });

}

function main() {

    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1) click(ev);};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = []; 

function click(ev) {

  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if(g_selectedType == 'POINT') {
    point = new Point();
  } else if(g_selectedType == 'TRIANGLE') {
    point = new Triangle();
  } else if(g_selectedType == 'CIRCLE') {
    point = new Circle();
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  if (g_selectedType == 'CIRCLE') {
    point.segments = Number(g_selectedSegments);
  }
  g_shapesList.push(point);

  RenderAllShapes();

  }

  function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return [x, y];
  }

  function RenderAllShapes() {
 // Clear <canvas>

  var startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  if (g_showManualPicture) {
    renderMyTrianglePicture();
  }

   var duration = performance.now() - startTime;
  sendTextToHTML("numdots: " + len + " ms: " + Math.floor(duration) + "fps " + Math.floor(10000/duration), "numdotsspan");
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function toggleReferenceImage() {
  var img = document.getElementById('referenceImage');
  var btn = document.getElementById('toggleReferenceButton');
  if (!img || !btn) {
    return;
  }

  if (img.style.display === 'none') {
    img.style.display = 'block';
    btn.textContent = 'Hide Reference Photo';
  } else {
    img.style.display = 'none';
    btn.textContent = 'Show Reference Photo';
  }
}

function renderMyTrianglePicture() {
  var triangles = [
    // v:: [x1, y1, x2, y2, x3, y3]
    //BUTTFERLY VERTICES
    { c: [0.55, 0.27, 0.07, 1.0], v: [-0.25, 0.35, 0.25, 0.35, -0.25, -0.35] },
    { c: [0.55, 0.27, 0.07, 1.0], v: [0.25, 0.35, 0.25, -0.35, -0.25, -0.35] },
    { c: [1.0, 0.55, 0.0, 1.0], v: [-0.25, 0.35, -0.25, -0.35, -0.65, 0.0] },
    { c: [1.0, 0.55, 0.0, 1.0], v: [0.25, 0.35, 0.25, -0.35, 0.65, 0.0] },
    { c: [0.10, 0.08, 0.05, 1.0], v: [-0.29, 0.22, -0.29, 0.06, -0.43, 0.13] },
    { c: [0.10, 0.08, 0.05, 1.0], v: [-0.29, -0.06, -0.29, -0.22, -0.43, -0.13] },
    { c: [0.98, 0.74, 0.15, 1.0], v: [-0.38, 0.10, -0.50, 0.02, -0.43, -0.04] },
    { c: [0.10, 0.08, 0.05, 1.0], v: [0.29, 0.22, 0.29, 0.06, 0.43, 0.13] },
    { c: [0.10, 0.08, 0.05, 1.0], v: [0.29, -0.06, 0.29, -0.22, 0.43, -0.13] },
    { c: [0.98, 0.74, 0.15, 1.0], v: [0.38, 0.10, 0.50, 0.02, 0.43, -0.04] },
    { c: [0.92, 0.48, 0.00, 1.0], v: [-0.33, 0.22, -0.41, 0.28, -0.49, 0.14] },
    { c: [0.92, 0.48, 0.00, 1.0], v: [-0.33, -0.24, -0.49, -0.14, -0.41, -0.31] },
    { c: [0.92, 0.48, 0.00, 1.0], v: [0.33, 0.20, 0.49, 0.14, 0.41, 0.30] },
    { c: [0.92, 0.48, 0.00, 1.0], v: [0.33, -0.23, 0.41, -0.30, 0.49, -0.14] },
    { c: [0.98, 0.62, 0.10, 1.0], v: [-0.37, 0.10, -0.43, 0.18, -0.47, 0.05] },
    { c: [0.98, 0.62, 0.10, 1.0], v: [-0.37, -0.10, -0.47, -0.05, -0.43, -0.18] },
    { c: [0.98, 0.62, 0.10, 1.0], v: [0.37, 0.06, 0.47, 0.05, 0.43, 0.18] },
    { c: [0.98, 0.62, 0.10, 1.0], v: [0.37, -0.10, 0.43, -0.18, 0.47, -0.05] },
    { c: [0.96, 0.52, 0.02, 1.0], v: [-0.50, 0.13, -0.62, 0.02, -0.58, 0.20] },
    { c: [0.96, 0.52, 0.02, 1.0], v: [-0.50, -0.10, -0.58, -0.16, -0.62, -0.02] },
    { c: [0.96, 0.52, 0.02, 1.0], v: [0.50, 0.13, 0.58, 0.02, 0.62, 0.18] },
    { c: [0.96, 0.52, 0.02, 1.0], v: [0.50, -0.10, 0.62, -0.16, 0.62, -0.02] },
    { c: [0.55, 0.27, 0.07, 1.0], v: [-0.25, -0.30, 0.25, -0.30, 0.0, -0.75] },
    { c: [0.55, 0.27, 0.07, 1.0], v: [-0.25, 0.35, 0.25, 0.35, 0.0, 0.65] },
    { c: [0.12, 0.08, 0.05, 1.0], v: [-0.12, 0.49, -0.04, 0.49, -0.08, 0.56] },
    { c: [0.12, 0.08, 0.05, 1.0], v: [0.04, 0.49, 0.12, 0.49, 0.08, 0.56] },
    { c: [1.0, 0.55, 0.0, 1.0], v: [-0.20, 0.50, -0.12, 0.54, -0.28, 0.70] },
    { c: [1.0, 0.55, 0.0, 1.0], v: [0.12, 0.54, 0.20, 0.50, 0.28, 0.70] },

  ];

  for (var i = 0; i < triangles.length; i++) {
    var t = triangles[i];
    gl.uniform4f(u_FragColor, t.c[0], t.c[1], t.c[2], t.c[3]);
    drawTriangle(t.v);
  }
}