import {VertexAttributes} from './vertex-attributes';
import {ShaderProgram} from './shader-program';
import {VertexArray} from './vertex-array';
import {Matrix4} from './matrix';
import {Vector4, Vector3} from './vector';
import {Camera} from './camera';

let rotationSpeed = .2;
let movementSpeed = .5;
let canvas;
let groundAttributes;
let shaderProgram, moonShaderProgram;
let groundVao;
let moonVao;
let moonMover = Matrix4.translate(-75, 30, -10);
let moonRotater = Matrix4.identity();
let clipFromEye;
let strafe = 0;
let forward = 0;
let camera;
let step = 0;
let moonInterval;
let blendAmount = 0.0;

let trailMovers = [];
let trailRotaters = [];
let trailVaos = [];
let trailShaders = [];
const TRAIL_DEPTH = 5;

let blurBox, trailBox;

async function readImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

function createTexture2d(image, textureUnit) {
  gl.activeTexture(textureUnit);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.6, 0.6, 0.9, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  shaderProgram.bind();

  shaderProgram.setUniformMatrix4('clipFromEye', clipFromEye);
  shaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld);
  shaderProgram.setUniformMatrix4('worldFromModel', Matrix4.identity());
  shaderProgram.setUniform1i('grassTexture', 0);
  groundVao.bind();
  groundVao.drawIndexed(gl.TRIANGLES);
  groundVao.unbind();
  shaderProgram.unbind();

  moonShaderProgram.bind();

  moonShaderProgram.setUniformMatrix4('clipFromEye', clipFromEye);
  moonShaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld);
  moonShaderProgram.setUniformMatrix4('worldFromModel', moonMover.multiplyMatrix(moonRotater));
  moonShaderProgram.setUniform1i('defaultTexture', 1);
  moonShaderProgram.setUniform1i('blurredTexture', 2);
  moonShaderProgram.setUniform1f('blendAmount', blendAmount);
  if (trailVaos.length > 0) {
    moonShaderProgram.setUniform1f('opacity', 0.0);
  } else {
    moonShaderProgram.setUniform1f('opacity', 1.0);
  }
  moonVao.bind();
  moonVao.drawIndexed(gl.TRIANGLES);
  moonVao.unbind();
  moonShaderProgram.unbind();

  console.log(trailVaos.length, trailMovers.length, trailRotaters.length);
  console.log(trailMovers[0], trailMovers[1], trailMovers[2]);
  for (let i = 0; i < trailVaos.length; i++) {
    trailShaders[i].bind();
    trailShaders[i].setUniformMatrix4('clipFromEye', clipFromEye);
    trailShaders[i].setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld);
    trailShaders[i].setUniformMatrix4('worldFromModel', trailMovers[i].multiplyMatrix(trailRotaters[i]));
    trailShaders[i].setUniform1i('defaultTexture', 1);
    trailShaders[i].setUniform1i('blurredTexture', 2);
    trailShaders[i].setUniform1f('blendAmount', blendAmount);
    trailShaders[i].setUniform1f('opacity', (i / trailVaos.length) + 0.1);
    trailVaos[i].bind();
    trailVaos[i].drawIndexed(gl.TRIANGLES);
    trailVaos[i].unbind();
    trailShaders[i].unbind();
  }
}

function onResizeWindow() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  clipFromEye = Matrix4.fovPerspective(45, canvas.width / canvas.height, 0.1, 1000);
  render();
}

function generateSphere(nlatitudes, nlongitudes, radius) {
  const positions = [];
  const normals = [];
  const indices = [];
  const texPositions = [];

  const seedPositions = [];
  for (let ilatitude = 0; ilatitude < nlatitudes; ++ilatitude) {
    const radians = ilatitude / (nlatitudes - 1) * Math.PI - Math.PI / 2;
    const x = radius * Math.cos(radians);
    const y = radius * Math.sin(radians);
    seedPositions.push(Vector4.notConstructor(x, y, 0, 1));
  }

  for (let ilongitude = 0; ilongitude < nlongitudes; ++ilongitude) {
    const degrees = ilongitude / (nlongitudes - 1) * 360;
    const rotater = Matrix4.rotateY(degrees);
    for (let ilatitude = 0; ilatitude < nlatitudes; ++ilatitude) {
      const p = rotater.multiplyVector(seedPositions[ilatitude]);
      positions.push(p.x , p.y +10 , p.z);
      texPositions.push((ilongitude / (nlongitudes - 1)), (ilatitude / (nlatitudes - 1)));
      const normal = p.normalize();
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  for (let ilongitude = 0; ilongitude < nlongitudes; ++ilongitude) {
    const iNextLongitude = (ilongitude + 1) % nlongitudes;
    for (let ilatitude = 0; ilatitude < nlatitudes - 1; ++ilatitude) {
      const iNextLatitude = (ilatitude + 1) % nlatitudes;
      indices.push(
        ilongitude * nlatitudes + ilatitude,
        ilongitude * nlatitudes + iNextLatitude,
        iNextLongitude * nlatitudes + iNextLatitude,
      );
      indices.push(
        ilongitude * nlatitudes + ilatitude,
        iNextLongitude * nlatitudes + iNextLatitude,
        iNextLongitude * nlatitudes + ilatitude,
      );
    }
  }
  
  const attributes = new VertexAttributes();
  attributes.addAttribute('texPosition', nlatitudes * nlongitudes, 2, texPositions);
  attributes.addAttribute('position', nlatitudes * nlongitudes, 3, positions);
  attributes.addAttribute('normal', nlatitudes * nlongitudes, 3, normals);
  attributes.addIndices(indices);

  return attributes;
}

async function initialize() {
  canvas = document.getElementById('canvas');
  window.gl = canvas.getContext('webgl2');

  blurBox = document.getElementById('blur-box');
  trailBox = document.getElementById('trail-box');

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);

  const grassImage = await readImage('grassTexture.jpeg');
  createTexture2d(grassImage, gl.TEXTURE0);

  const moonImage = await readImage('moonimage.jpg');
  createTexture2d(moonImage, gl.TEXTURE1);

  const moonImageBlurred = await readImage('moonimageblurred.jpg');
  createTexture2d(moonImageBlurred, gl.TEXTURE2);


  const positions = [
    -100, -0.5,  100,
     100, -0.5,  100,
    -100, -0.5, -100,
     100, -0.5, -100,
  ];

  const texPositions = [
      0.2, 0.2,
      0.8, 0.2,
      0.8, 0.8,
      0.2, 0.8, 
  ];

  const normals = [
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ];

  const indices = [
    0, 1, 3,
    0, 3, 2,
  ];
  let moonAttributes = generateSphere(20, 20, 5);

  groundAttributes = new VertexAttributes();
  groundAttributes.addAttribute('position', 4, 3, positions);
  groundAttributes.addAttribute('texPosition', 4, 2, texPositions);
  groundAttributes.addAttribute('normal', 4, 3, normals);
  groundAttributes.addIndices(indices);

  const vertexSource = `
    uniform mat4 clipFromEye;
    uniform mat4 eyeFromWorld;
    uniform mat4 worldFromModel;

    in vec3 position;
    in vec2 texPosition;
    in vec3 normal;

    out vec3 mixNormal;
    out vec2 mixTexPosition;

    void main() {
      gl_PointSize = 3.0;
      gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
      mixNormal = (eyeFromWorld * worldFromModel * vec4(normal, 0.0)).xyz;
      mixTexPosition = texPosition;
    }
  `;

  const fragmentSource = `
    uniform sampler2D grassTexture;

    const float ambientFactor = 0.5;
    const vec3 lightDirection = normalize(vec3(0.0, 1.0, 0.0));
    const vec3 albedo = vec3(0.8, 0.8, 0.8);

    in vec3 mixNormal;
    in vec2 mixTexPosition;

    out vec4 fragmentColor;

    void main() {
      vec3 normal = normalize(mixNormal);
      /*float litness = max(0.0, dot(normal, lightDirection));
      vec3 diffuse = albedo * litness * (1.0 - ambientFactor);
      vec3 ambient = albedo * ambientFactor;
      fragmentColor = vec4(diffuse + ambient, 1.0);*/
      fragmentColor = texture(grassTexture, mixTexPosition);
    }
  `;

  const moonFragmentSource = `
    uniform sampler2D defaultTexture;
    uniform sampler2D blurredTexture;
    uniform float blendAmount;
    uniform float opacity;

    const float ambientFactor = 0.5;
    const vec3 lightDirection = normalize(vec3(0.0, 1.0, 0.0));
    const vec3 albedo = vec3(0.8, 0.8, 0.8);

    in vec3 mixNormal;
    in vec2 mixTexPosition;

    out vec4 fragmentColor;

    void main() {
      vec3 normal = normalize(mixNormal);
      vec4 texel = texture(defaultTexture, mixTexPosition);
      vec4 texel2 = texture(blurredTexture, mixTexPosition);
      fragmentColor = mix(texel, texel2, blendAmount) * vec4(opacity);
    }
  `;

  camera = new Camera(Vector3.fromValues(0, 20, -100), Vector3.fromValues(0, 0, 0), Vector3.fromValues(0, 1, 0));

  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
  moonShaderProgram = new ShaderProgram(vertexSource, moonFragmentSource);
  groundVao = new VertexArray(shaderProgram, groundAttributes);
  moonVao = new VertexArray(moonShaderProgram, moonAttributes);

  window.addEventListener('resize', onResizeWindow);
  onResizeWindow();

  canvas.addEventListener('pointerdown', event => {
    document.body.requestPointerLock();
  });

  window.addEventListener('resize', onResizeWindow);
  window.addEventListener('pointerdown', () => {
    document.body.requestPointerLock();
  });
  
  window.addEventListener('pointermove', event => {
    //console.log("This");
    if (document.pointerLockElement) {
      //console.log(-event.movementY);
      camera.yaw(-event.movementX * rotationSpeed);
    //  console.log("YAW YEET");
      camera.pitch(-event.movementY * rotationSpeed);
      render();
    }
  });

  window.addEventListener('keydown', event => {
    if(event.key === 'w') {
      forward = 1;
    } else if(event.key === 'a') {
      strafe = -1;
    } else if(event.key === 's') {
      forward = -1;
    } else if(event.key === 'd') {
      strafe = 1;
    }

    if(event.key === ' ') {
      if (step == 0) {
        moonInterval = setInterval(moveTheMoon, 10);
      }
      
    }
  });

  window.addEventListener('keyup', event => {
    if(event.key === 'w' || event.key === 's') {
      forward = 0;
    } else if(event.key === 'a' || event.key === 'd') {
      strafe = 0;
    }
  });

  move();
  onResizeWindow();
  
}

function moveTheMoon() {
  const MOVE_DURATION = 200;
  const MAX_SPEED = 2;
  const DEGREES = 2;

  if (step > MOVE_DURATION) {
    step = 0;
    moonMover = Matrix4.translate(-75, 30, -10);
    moonRotater = Matrix4.identity();
    blendAmount = 0.0;
    trailMovers = [];
    trailRotaters = [];
    trailShaders = [];
    trailVaos = [];
    clearInterval(moonInterval);
  } else {
    step += 1;
    let proportion = step / MOVE_DURATION;
    if (blurBox.checked) {
      blendAmount = 1.0;
    } else {
      blendAmount = 0.0;
    }

    if (trailBox.checked) {
      generateTrailVAO(moonVao, moonMover, moonRotater);
    }
    
    moonMover = moonMover.multiplyMatrix(Matrix4.translate(MAX_SPEED * proportion, 0, 0));
    moonRotater = moonRotater.multiplyMatrix(Matrix4.rotateX(DEGREES));
  }

  render();
}

function generateTrailVAO(vao, mover, rotater) {
  trailShaders.push(moonShaderProgram);
  trailVaos.push(vao);
  trailMovers.push(mover.multiplyMatrix(Matrix4.translate(-5, 0, 0)));
  trailRotaters.push(rotater);

  if (trailVaos.length > TRAIL_DEPTH) {
    trailVaos.shift();
    trailShaders.shift();
    trailMovers.shift();
    trailRotaters.shift();
  }

}

function move() {
  if (forward != 0) {
    camera.advance(movementSpeed * forward);
    render();
  } 
  if (strafe != 0) {
    camera.strafe(movementSpeed * strafe);
    render();
  }
  requestAnimationFrame(move);
};

window.addEventListener('load', initialize);
