import * as THREE from 'three';
import {GLTFLoader,OBJLoader, OrbitControls, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import {GUI} from 'lil-gui';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; 
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; 
import {Dot, SolarSystemBody, SolarSystemObject } from './classes.js';


var objectsToIntersect = [];
var idToInspectableObjectDictionary = {};

var sunPivot, mercuryPivot, venusPivot, earthPivot, moonPivot, marsPivot, asteroidBeltPivot, jupiterPivot, saturnPivot;
var sun, mercury, venus, earth, moon, mars, jupiter, saturn;
var jamesWebb, asteroidBelt, apolloLunarModule;

var mercuryRing, venusRing, earthRing, marsRing, asteroidBeltRing, jupiterRing, saturnRing, saturnOrbitRing; 

var cosmicObjectToInspect;
var pointedCosmicObject;

const sunSize = 30;
const mercurySize = 2;
const venusSize = 5;
const earthSize = 4;
const moonSize = 1;
const marsSize = 5; 
const jamesWebbSize = 0.09;
const jupiterSize = 12;
const saturnSize = 10;

const mainAsteroidBeltAsteroidsAmount = 1000;

const mercuryRingRadius = 70;
const venusRingRadius = 120;
const earthRingRadius = 200;
const marsRingRadius = 280;
const asteroidBeltRingRadius = 340;
const jupiterRingRadius = 380;
const saturnRingRadius = 430;

// function randomInt(min, max){
//      return Math.floor(Math.random() * (max-min+1)+min);
// }

let inspectionDistanceOffset = 15;

const scene = new THREE.Scene(); 
const renderer = new THREE.WebGLRenderer(); 
const raycaster = new THREE.Raycaster();
let audioListener = new THREE.AudioListener();
let audioLoader = new THREE.AudioLoader();

let backgroundAudio = new THREE.Audio(audioListener);

// FIXME: background audio doesn't play if player interacted with the page while the page is still loading
audioLoader.load("./assets/meditative.mp3", function(buffer){
     backgroundAudio.setBuffer(buffer);
     backgroundAudio.setVolume(1.0);
     backgroundAudio.setLoop(true);
});

let whooshAudio = new THREE.Audio(audioListener);
audioLoader.load("./assets/whoosh.mp3", function(buffer){
     whooshAudio.setBuffer(buffer);
});

const textureLoader = new THREE.TextureLoader();

const earthTexture = textureLoader.load('./assets/earth-texture-2k.jpg');
earthTexture.colorSpace = THREE.SRGBColorSpace;
const earthHeightMapTexture = textureLoader.load('./assets/earth-height-map-2k.jpg');

const moonTexture = textureLoader.load('./assets/moon-texture-2k.jpg');
moonTexture.colorSpace = THREE.SRGBColorSpace;

const mercuryTexture = textureLoader.load('./assets/mercury-texture.jpg');
mercuryTexture.colorSpace = THREE.SRGBColorSpace;

const venusTexture = textureLoader.load('./assets/venus-texture.jpg');
venusTexture.colorSpace = THREE.SRGBColorSpace;

const marsTexture = textureLoader.load('./assets/mars-texture-2k.jpg');
marsTexture.colorSpace = THREE.SRGBColorSpace;
const marsHeightMapTexture = textureLoader.load('./assets/mars-height-map-2k.jpg');

const jupiterTexture = textureLoader.load('./assets/jupiter-texture-2k.jpg');
jupiterTexture.colorSpace = THREE.SRGBColorSpace;

const saturnTexture = textureLoader.load('./assets/saturn-texture.jpg');
saturnTexture.colorSpace = THREE.SRGBColorSpace;


// const objLoader = new OBJLoader();
// objLoader.load('./assets/james-webb.fbx', (root) => {
//      // root.position.x = 100;
//      scene.add(root);
// });


var glassContainer;
var nameText;
var descriptionText;



// renderer.setClearColor(0x010328);


// Sun emmision ambientLight
scene.add(new THREE.AmbientLight(0x000022));
// scene.add(new THREE.DirectionalLight(0xfce570, 3));
scene.add(new THREE.PointLight(0xffffff, 100000, 10000000));

// renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 ); 

const controls = new OrbitControls(camera, renderer.domElement );
controls.autoRotateSpeed = 2;


// by default no ascii effect
document.body.appendChild( renderer.domElement );

// let directionalLight = new THREE.DirectionalLight(0xffffff, 100);
// scene.add(directionalLight);




const composer = new EffectComposer(renderer);

const renderPass = new RenderPass( scene, camera ); 
composer.addPass( renderPass ); 
const glowPass = new UnrealBloomPass();
composer.addPass( glowPass ); 
// const glitchPass = new GlitchPass(); 
// composer.addPass( glitchPass ); 
// const outputPass = new OutputPass(); 
// composer.addPass( outputPass );

let settings = {
     dotsAmount: 1000,
     dotTraversalRange: 100,
     dotsRadius: 0.3,
     distanceAffection: 100,
     frictionRate : 0.003,
}

let teleport = {
     jamesWebb: function(){
          startInspectingObject(jamesWebb);
     }
}

let mousePos = new THREE.Vector3(0,0,0);
let pointer = new THREE.Vector2();
let shouldMoveCameraToTarget = false;

let dots = [];

let dotGeometry = new THREE.SphereGeometry(settings.dotsRadius); 

// let dotMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 

function changeDotsAmount(value){
     for(let i = 0; i < dots.length; i++){
          scene.remove(dots[i].mesh);
     }
     dots = [];

     for(let i = 0; i < value; i++){
          dots.push(new Dot(dotGeometry));
          scene.add(dots[i].mesh);
     }
}


const gui = new GUI();
gui.title("Teleport");
gui.add(teleport, "jamesWebb");
// gui.add(settings, "distanceAffection", 50, 300, 10);
// gui.add(settings, "frictionRate", 0.003, 0.01);
// gui.add(settings, "dotsAmount", 100, 7000).onChange(value => changeDotsAmount(value));


function changeDotsRadius(radius){
     dotGeometry = new THREE.SphereGeometry(radius); 
     for(let i = 0; i < settings.dotsAmount; i++){
          scene.remove(dots[i].mesh);
     }
     dots = [];

     for(let i = 0; i < settings.dotsAmount; i++){
          dots.push(new Dot(dotGeometry));
          scene.add(dots[i].mesh);
     }
}










function toggleAutoRotation(state){
     controls.autoRotate = state;
}



function followTargetObject(){

     // Getting object's global position and following it every function call. 
     // Required setting orbit control target every call because the object is always moving.  

     let targetGlobalPos = new THREE.Vector3();
     cosmicObjectToInspect.mesh.getWorldPosition(targetGlobalPos);
     controls.target.copy(targetGlobalPos);
     camera.lookAt(targetGlobalPos);

     let dist = camera.position.distanceTo(targetGlobalPos);
    
     if(shouldMoveCameraToTarget){
          // multiplied by 2 in order to not clip through an object
          if(dist > cosmicObjectToInspect.meshRadius * 1.5){
               camera.position.lerp(targetGlobalPos, 0.02);
          }
          else{
               shouldMoveCameraToTarget = false;
          }
          // resetting inspection logic
     }

     
     

}







for(let i = 0; i < settings.dotsAmount; i++){
     dots.push(new Dot(dotGeometry));
     scene.add(dots[i].mesh);
}


camera.position.z = 300;

// Separate planet pivot is required in order to rotate them with different speed.


sunPivot = new THREE.Group();
sun = new SolarSystemBody(sunPivot,sunSize, new THREE.MeshPhongMaterial({color: 0xfce570, emissive: 0xfce570, emissiveIntensity: 2.0}), "Sun", 
"The Sun is the star at the center of the Solar System. It is a massive, nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating the energy from its surface mainly as visible light and infrared radiation with 10% at ultraviolet energies");
// const sun = new THREE.Mesh(new THREE.SphereGeometry(30), new THREE.MeshPhongMaterial({color: 0xfce570, emissive: 0xfce570, emissiveIntensity: 3}));
sunPivot.add(sun.mesh);
scene.add(sunPivot);

mercuryPivot = new THREE.Group();
mercury = new SolarSystemBody(mercuryPivot,mercurySize, new THREE.MeshPhongMaterial({color: 0xffffff, map: mercuryTexture}), "Mercury",
"Mercury is the first planet from the Sun and the smallest in the Solar System. In English, it is named after the ancient Roman god Mercurius (Mercury), god of commerce and communication, and the messenger of the gods. Mercury is classified as a terrestrial planet, with roughly the same surface gravity as Mars. The surface of Mercury is heavily cratered, as a result of countless impact events that have accumulated over billions of years.") ;

mercury.mesh.position.x = mercuryRingRadius;
mercuryPivot.add(mercury.mesh);
scene.add(mercuryPivot);

venusPivot = new THREE.Group();
venus = new SolarSystemBody(venusPivot,venusSize, new THREE.MeshPhongMaterial({color: 0xffffff, map: venusTexture}), "Venus",
"Venus is the second planet from the Sun. It is a terrestrial planet and is the closest in mass and size to its orbital neighbour Earth. Venus has by far the densest atmosphere of the terrestrial planets, composed mostly of carbon dioxide with a thick, global sulfuric acid cloud cover.") ;
venus.mesh.position.x = venusRingRadius;
venusPivot.add(venus.mesh);
scene.add(venusPivot);

earthPivot = new THREE.Group();
earth = new SolarSystemBody(earthPivot, earthSize,new THREE.MeshPhongMaterial({color:0xffffff, map: earthTexture, displacementMap: earthHeightMapTexture, displacementScale: 0.05}), "Earth",
"Earth is the third planet from the Sun and the only astronomical object known to harbor life. This is enabled by Earth being an ocean world, the only one in the Solar System sustaining liquid surface water. Almost all of Earth's water is contained in its global ocean, covering 70.8% of Earth's crust. The remaining 29.2% of Earth's crust is land, most of which is located in the form of continental landmasses within Earth's land hemisphere.");
earth.mesh.position.x = earthRingRadius;
earthPivot.add(earth.mesh);
scene.add(earthPivot);

const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/james-webb/scene.gltf', (gltf) =>{

     const root = gltf.scene;
     // root.updateMatrixWorld();

     jamesWebb = new SolarSystemObject(root, jamesWebbSize,"James Webb Space Telescope", 
          "The James Webb Space Telescope (JWST) is a space telescope designed to conduct infrared astronomy. As the largest telescope in space, it is equipped with high-resolution and high-sensitivity instruments, allowing it to view objects too old, distant, or faint for the Hubble Space Telescope. This enables investigations across many fields of astronomy and cosmology, such as observation of the first stars and the formation of the first galaxies, and detailed atmospheric characterization of potentially habitable exoplanets.");
     // scene.add(jamesWebb.mesh);

     earthPivot.add(jamesWebb.mesh);

     // FIXME: Required to click on the box itself, if a click will land on the model it will not count for whatever reason

     // In order to create full bounding box from GLTF scene
     const box = new THREE.BoxHelper(root, 0xffffff);
     box.visible = false;
     jamesWebb.mesh.add(box);

     root.position.x = earthRingRadius + 15;
     root.position.y = 5;
     root.scale.set(jamesWebbSize, jamesWebbSize, jamesWebbSize);
     root.rotateZ(-(Math.PI/2));

     
     
     // Just passing to intersection array without adding bounding box to the scene  
     objectsToIntersect.push(box);
     idToInspectableObjectDictionary[box.id] = jamesWebb;

});



moonPivot = new THREE.Group();
moon = new SolarSystemBody(moonPivot, moonSize, new THREE.MeshPhongMaterial({color:0xffffff, map: moonTexture}), "Moon",
"The Moon is Earth's only natural satellite. It orbits at an average distance of 384,400 km (238,900 mi), about 30 times the diameter of Earth. Tidal forces between Earth and the Moon have synchronized the Moon's orbital period (lunar month) with its rotation period (lunar day) at 29.5 Earth days, causing the same side of the Moon to always face Earth. The Moon's gravitational pull—and, to a lesser extent, the Sun's—are the main drivers of Earth's tides.");

moonPivot.add(moon.mesh);
moon.mesh.position.x += 8;
earth.mesh.add(moonPivot);

// gltfLoader.load('./assets/apollo-lunar-module.glb', (gltf) => {
//      const root = gltf.scene;

//      apolloLunarModule = new SolarSystemObject(root, 5, "Apollo Lunar Module",
//           "Lunar Module"
//      );

//      moon.mesh.add(root);

//      let moonGlobalPos = new THREE.Vector3();
//      moon.mesh.getWorldPosition(moonGlobalPos);
//      root.position.copy(moonGlobalPos);
     
     
//      // FIXME: Required to click on the box itself, if a click will land on the model it will not count for whatever reason

//      // In order to create full bounding box from GLTF scene
//      // const box = new THREE.BoxHelper(root, 0xffffff);
//      // box.visible = false;
//      // apolloLunarModule.mesh.add(box);

// });




marsPivot = new THREE.Group();
mars = new SolarSystemBody(marsPivot, marsSize, new THREE.MeshPhongMaterial({color: 0xffffff, map: marsTexture, displacementMap: marsHeightMapTexture, displacementScale: 0.1}), "Mars",
"Mars is the fourth planet from the Sun. The surface of Mars is orange-red because it is covered in iron(III) oxide dust, giving it the nickname 'the Red Planet'. Mars is among the brightest objects in Earth's sky, and its high-contrast albedo features have made it a common subject for telescope viewing. It is classified as a terrestrial planet and is the second smallest of the Solar System's planets with a diameter of 6,779 km (4,212 mi). In terms of orbital motion, a Martian solar day (sol) is equal to 24.5 hours, and a Martian solar year is equal to 1.88 Earth years (687 Earth days). Mars has two natural satellites that are small and irregular in shape: Phobos and Deimos. ");
mars.mesh.position.x = marsRingRadius;
marsPivot.add(mars.mesh);
scene.add(marsPivot);

asteroidBeltPivot = new THREE.Group();
for(let i = 0; i < mainAsteroidBeltAsteroidsAmount; i++){
     let widthSegments = randInt(1,4);
     let heightSegments = randInt(1,4);
     let asteroid = new THREE.Mesh(new THREE.SphereGeometry(1.5,widthSegments, heightSegments), new THREE.MeshPhongMaterial({color: 0x533a34}));
     // Degrees 2 Radians
     let angle = randFloat(0,360) * (Math.PI / 180); 
     asteroid.position.x = asteroidBeltRingRadius * Math.cos(angle);
     asteroid.position.x += randFloat(-4,4) 
     asteroid.position.y = randFloat(-4,4);
     asteroid.position.z = asteroidBeltRingRadius * Math.sin(angle);
     asteroid.position.z += randFloat(-4,4) 
     asteroidBeltPivot.add(asteroid);
}
scene.add(asteroidBeltPivot);

jupiterPivot = new THREE.Group();
jupiter = new SolarSystemBody(jupiterPivot, jupiterSize, new THREE.MeshPhongMaterial({color: 0xffffff, map: jupiterTexture}), "Jupiter",
"Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than 2.5 times that of all the other planets in the Solar System combined and slightly less than one-thousandth the mass of the Sun. Its diameter is eleven times that of Earth, and a tenth that of the Sun. Jupiter orbits the Sun at a distance of 5.20 AU (778.5 Gm), with an orbital period of 11.86 years. It is the third brightest natural object in the Earth's night sky, after the Moon and Venus, and has been observed since prehistoric times. Its name derives from that of Jupiter, the chief deity of ancient Roman religion.");
jupiter.mesh.position.x = jupiterRingRadius;
jupiterPivot.add(jupiter.mesh);
scene.add(jupiterPivot);

saturnPivot = new THREE.Group();
saturn = new SolarSystemBody(saturnPivot, saturnSize, new THREE.MeshPhongMaterial({color: 0xffffff, map: saturnTexture}), "Saturn",
"Saturn is the sixth planet from the Sun and the second largest in the Solar System, after Jupiter. It is a gas giant, with an average radius of about nine times that of Earth. It has an eighth the average density of Earth, but is over 95 times more massive. Even though Saturn is almost as big as Jupiter, Saturn has less than a third the mass of Jupiter. Saturn orbits the Sun at a distance of 9.59 AU (1,434 million km), with an orbital period of 29.45 years.");
saturn.mesh.position.x = saturnRingRadius;
saturnPivot.add(saturn.mesh);
scene.add(saturnPivot);


// Ring creation is not automated because radiuses of the rings are individual
const ringMat = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.01});

let mercuryRingGeo = new THREE.TorusGeometry(mercuryRingRadius, 0.2, 128, 128);
mercuryRing =  new THREE.Mesh(mercuryRingGeo, ringMat);
mercuryRing.rotateX(Math.PI / 2);
scene.add(mercuryRing);

let venusRingGeo = new THREE.TorusGeometry(venusRingRadius, 0.2, 128, 128);
venusRing =  new THREE.Mesh(venusRingGeo, ringMat);
venusRing.rotateX(Math.PI / 2);
scene.add(venusRing);

let earthRingGeo = new THREE.TorusGeometry(earthRingRadius, 0.2, 128, 128);
earthRing =  new THREE.Mesh(earthRingGeo, ringMat);
earthRing.rotateX(Math.PI / 2);
scene.add(earthRing);

let marsRingGeo = new THREE.TorusGeometry(marsRingRadius, 0.2, 128, 128);
marsRing =  new THREE.Mesh(marsRingGeo, ringMat);
marsRing.rotateX(Math.PI / 2);
scene.add(marsRing);

let asteroidBeltRingGeo = new THREE.TorusGeometry(asteroidBeltRingRadius, 0.2, 128, 128);
asteroidBeltRing =  new THREE.Mesh(asteroidBeltRingGeo, ringMat);
asteroidBeltRing.rotateX(Math.PI / 2);
scene.add(asteroidBeltRing);

let jupiterRingGeo = new THREE.TorusGeometry(jupiterRingRadius, 0.2,128,128);
jupiterRing = new THREE.Mesh(jupiterRingGeo, ringMat);
jupiterRing.rotateX(Math.PI / 2);
scene.add(jupiterRing);

let saturnRingGeo = new THREE.TorusGeometry(saturnRingRadius, 0.2,128,128);
saturnRing = new THREE.Mesh(saturnRingGeo, ringMat);
saturnRing.rotateX(Math.PI / 2);
scene.add(saturnRing);

objectsToIntersect.push(sun.mesh);
objectsToIntersect.push(mercury.mesh);
objectsToIntersect.push(venus.mesh);
objectsToIntersect.push(earth.mesh);
objectsToIntersect.push(mars.mesh);
objectsToIntersect.push(moon.mesh);
objectsToIntersect.push(jupiter.mesh);
objectsToIntersect.push(saturn.mesh);

idToInspectableObjectDictionary[sun.mesh.id] = sun;
idToInspectableObjectDictionary[mercury.mesh.id] = mercury;
idToInspectableObjectDictionary[venus.mesh.id] = venus;
idToInspectableObjectDictionary[earth.mesh.id] = earth;
idToInspectableObjectDictionary[mars.mesh.id] = mars;
idToInspectableObjectDictionary[moon.mesh.id] = moon;
idToInspectableObjectDictionary[jupiter.mesh.id] = jupiter;
idToInspectableObjectDictionary[saturn.mesh.id] = saturn;


function animate() {
     

     controls.update();
     // for(let i = 0; i < settings.dotsAmount; i++){
     //      if(dots[i].mesh.position.distanceTo(mousePos) < settings.distanceAffection){
     //           dots[i].setVelocity();
     //           // collis
     //      }

     //      dots[i].move();
     //      dots[i].friction();
     // }   

    simulateCosmicMovement();

     

     if(cosmicObjectToInspect){
          followTargetObject();
          
     }


     raycaster.setFromCamera(pointer, camera);
     const intersects = raycaster.intersectObjects(objectsToIntersect, false);
     if(intersects.length > 0){
          console.log(intersects[0].object);
          pointedCosmicObject = idToInspectableObjectDictionary[intersects[0].object.id];
     }
     else{
          pointedCosmicObject = null;
     }
     // requestAnimationFrame(animate);
     composer.render();
     // renderer.render( scene, camera ); 


} 

setupUserInputEvents();

renderer.setAnimationLoop( animate );


function simulateCosmicMovement(){


     mercuryPivot.rotation.y += 0.002;
     mercury.mesh.rotation.y -= 0.005;
     mercury.mesh.rotation.x -= 0.0006;


     venusPivot.rotation.y += 0.0015;
     venus.mesh.rotation.y -= 0.005;
     venus.mesh.rotation.x -= 0.0006;


     earthPivot.rotation.y += 0.0010;
     earth.mesh.rotation.y -= 0.005;
     earth.mesh.rotation.x -= 0.0006;

     moonPivot.rotation.y += 0.015;

     marsPivot.rotation.y += 0.0005;
     mars.mesh.rotation.y -= 0.003;
     mars.mesh.rotation.x -= 0.0003;

     asteroidBeltPivot.rotation.y += 0.00010;

     jupiterPivot.rotation.y += 0.0001;
     jupiter.mesh.rotation.y -= 0.001;
     jupiter.mesh.rotation.x -= 0.0001;

     saturnPivot.rotation.y += 0.00007;
     saturn.mesh.rotation.y -= 0.0007;
     saturn.mesh.rotation.x -= 0.00007;
}





function removeCosmicObjectInfo(){
     if(glassContainer){
          glassContainer.remove();
     }
     if(nameText){
          nameText.remove();
     }
     if(descriptionText){
          descriptionText.remove();
     }
}

function startInspectingObject(targetObject){
     whooshAudio.play();
               
     cosmicObjectToInspect = targetObject;
     console.log("Clicked cosmic object:" + cosmicObjectToInspect);


     shouldMoveCameraToTarget = true;

     // cleaning from previous info
     removeCosmicObjectInfo(); 
     
     glassContainer = document.createElement('div');
     glassContainer.className = "glass-container";

     nameText = document.createElement('h1');
     nameText.innerHTML = cosmicObjectToInspect.infoName;
     descriptionText = document.createElement('p');
     descriptionText.innerHTML = cosmicObjectToInspect.infoDescription;

     glassContainer.appendChild(nameText);
     glassContainer.appendChild(descriptionText);

     document.body.appendChild(glassContainer);
     
     toggleAutoRotation(true);
}

function stopInspectingObject(){
     toggleAutoRotation(false);
     cosmicObjectToInspect = null;
     shouldMoveCameraToTarget = false;
     removeCosmicObjectInfo();
}

function setupUserInputEvents(){

     window.addEventListener("resize", onWindowResize,false);

     function onWindowResize() {

          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();


          renderer.setSize( window.innerWidth, window.innerHeight ); 
          

     }


     document.addEventListener("keydown", onDocumentKeyDown, false);
     function onDocumentKeyDown(event) {
          
          var keyCode = event.which;
          if (keyCode == 72) { // 'h' ascii value
               gui.show(gui._hidden);
          }
     };

     document.addEventListener("mousedown", onDocumentMouseDown, false);
     function onDocumentMouseDown(event){
          event.preventDefault();

          // audio loading on user interaction, background music
          if(!backgroundAudio.isPlaying){
               camera.add(audioListener); 
               backgroundAudio.play();
               
          }

          if(pointedCosmicObject !== null){
              startInspectingObject(pointedCosmicObject); 
          }
          else{
               if(cosmicObjectToInspect){
                    stopInspectingObject();
               } 
          }

     }

     document.addEventListener("mousemove", onDocumentMouseMove, false);
     function onDocumentMouseMove(event){
          
          event.preventDefault();

          pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
          pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

          mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
          mousePos.y = - (event.clientY / window.innerHeight) * 2 + 1;

     // Make the sphere follow the mouse
     var vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
          vector.unproject( camera );
          var dir = vector.sub( camera.position ).normalize();
          var distance = - camera.position.z / dir.z;
          mousePos = camera.position.clone().add( dir.multiplyScalar( distance ) );
          // console.log("X" + mousePos.x);
          // console.log("Y:" + mousePos.y);
          // console.log("Z:" + mousePos.z);

     }
}