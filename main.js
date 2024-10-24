import * as THREE from 'three';
import { OrbitControls, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import {GUI} from 'lil-gui';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; 
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; 


// function randomInt(min, max){
//      return Math.floor(Math.random() * (max-min+1)+min);
// }


const scene = new THREE.Scene(); 
const renderer = new THREE.WebGLRenderer(); 
const raycaster = new THREE.Raycaster();
let audioListener = new THREE.AudioListener();
let audioLoader = new THREE.AudioLoader();
let whooshAudio = new THREE.Audio(audioListener);
audioLoader.load("./assets/whoosh.mp3", function(buffer){
     whooshAudio.setBuffer(buffer);
});


let glassContainer;
let nameText;
let descriptionText;

var cosmicObjectToInspect;
var pointedCosmicObject;
// renderer.setClearColor(0x010328);


// Sun emmision ambientLight
scene.add(new THREE.AmbientLight(0xfce570));

// renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

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

let mousePos = new THREE.Vector3(0,0,0);
let pointer = new THREE.Vector2();
let shouldMoveCameraToTarget = false;

let dots = [];

let dotGeometry = new THREE.SphereGeometry(settings.dotsRadius); 
let dotColors = [];
dotColors.push(new THREE.Color(0xf9c54b));
dotColors.push(new THREE.Color(0xa891fb));
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


// const gui = new GUI();
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

class CosmicObject{
     constructor(planetRadius, planetMaterial, infoName, infoDescription){
          this.planetRadius = planetRadius;
          this.planetGeometry = new THREE.SphereGeometry(planetRadius);
          this.mesh = new THREE.Mesh(this.planetGeometry, planetMaterial);
          this.infoName = infoName;
          this.infoDescription = infoDescription;
     }
}


class Dot{
     constructor(geometry){
          let dotMaterial =  new THREE.MeshPhongMaterial();
          dotMaterial.color = new THREE.Color(dotColors[randInt(0,1)]);
          dotMaterial.emissive = dotMaterial.color;
          dotMaterial.emissiveIntensity = 5;

          // let dotMaterial =  new THREE.MeshBasicMaterial();
          // dotMaterial.color = dotColors[randInt(0,1)];

          this.mesh = new THREE.Mesh(geometry, dotMaterial);

          this.mesh.position.set(randInt(-window.innerWidth/4,window.innerWidth/4), randInt(-window.innerHeight/4,window.innerHeight/4), randInt(-window.innerWidth/4, window.innerWidth/4));
          this.velocityX = 0.0;
          this.velocityY = 0.0;
     }
     setVelocity(){
          let dir = new THREE.Vector2(mousePos.x-this.mesh.position.x, mousePos.y-this.mesh.position.y);
          dir.normalize();
          // console.log("dir x:" + dir.x);
          // console.log("dir y:" + dir.y);
          this.velocityX = dir.x;
          this.velocityY = dir.y;
     }

     move(){
          this.mesh.position.x += this.velocityX;
          this.mesh.position.y += this.velocityY; 
          // this.mesh.position.lerp(mousePos, 0.01);
     }
     friction(){
          if(this.velocityX > 0.0){
               if(this.velocityX - settings.frictionRate < 0.0){
                    this.velocityX = 0.0;
               }
               else {
                    this.velocityX -= settings.frictionRate;
               }
          }
          if(this.velocityX < 0.0){
               if(this.velocityX + settings.frictionRate > 0.0){
                    this.velocityX = 0.0;
               }
               else{
                    this.velocityX += settings.frictionRate;
               }
          }

          
          if(this.velocityY > 0.0){
               if(this.velocityY - 0.1 < 0.0){
                    this.velocityY = 0.0;
               }
               else {
                    this.velocityY -= 0.1;
               }
               
          }
          if(this.velocityY < 0.0){
               if(this.velocityY + 0.1 > 0.0){
                    this.velocityY = 0.0;
               }
               else {
                    this.velocityY += 0.1;
               }
          }

          
     }
     

}

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


var isAudioLoaded = false;

function toggleAutoRotation(state){
     controls.autoRotate = state;
}



function moveCameraToTarget(){
     
     let dist = camera.position.distanceTo(cosmicObjectToInspect.mesh.position);
     if(dist > 100){
          camera.position.lerp(cosmicObjectToInspect.mesh.position, 0.04);
     }
     else{
          shouldMoveCameraToTarget = false;
     }

     
     

}


document.addEventListener("mousedown", onDocumentMouseDown, false);
function onDocumentMouseDown(event){
     event.preventDefault();

     // audio loading on user interaction, background music
     if(!isAudioLoaded){
          camera.add( audioListener); 
          const audio = new THREE.Audio( audioListener); 
          audioLoader.load( './assets/meditative.mp3', function( buffer ) { 
                    audio.setBuffer( buffer ); 
                    audio.setVolume( 0.7 ); 
                    audio.autoplay = true;
                    audio.play();

               }
          );
     }

     if(pointedCosmicObject !== null){
          whooshAudio.play();
          
          cosmicObjectToInspect = pointedCosmicObject;

          controls.target.copy(cosmicObjectToInspect.mesh.position);
          camera.lookAt(cosmicObjectToInspect.mesh.position);

          shouldMoveCameraToTarget = true;
          // cleaning
          if(glassContainer){
               glassContainer.remove();
          }
          if(nameText){
               nameText.remove();
          }
          if(descriptionText){
               descriptionText.remove();
          }

          
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
     else{
          toggleAutoRotation(false);
          shouldMoveCameraToTarget = false;
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


for(let i = 0; i < settings.dotsAmount; i++){
     dots.push(new Dot(dotGeometry));
     scene.add(dots[i].mesh);
}


camera.position.z = 300;


const sun = new CosmicObject(30, new THREE.MeshPhongMaterial({color: 0xfce570, emissive: 0xfce570, emissiveIntensity: 3}), "Sun", 
"The Sun is the star at the center of the Solar System. It is a massive, nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating the energy from its surface mainly as visible light and infrared radiation with 10% at ultraviolet energies");
// const sun = new THREE.Mesh(new THREE.SphereGeometry(30), new THREE.MeshPhongMaterial({color: 0xfce570, emissive: 0xfce570, emissiveIntensity: 3}));
scene.add(sun.mesh);

const mercury = new CosmicObject(2, new THREE.MeshBasicMaterial({color: 0x333333}), "Mercury",
"Mercury is the first planet from the Sun and the smallest in the Solar System. In English, it is named after the ancient Roman god Mercurius (Mercury), god of commerce and communication, and the messenger of the gods. Mercury is classified as a terrestrial planet, with roughly the same surface gravity as Mars. The surface of Mercury is heavily cratered, as a result of countless impact events that have accumulated over billions of years.") ;
mercury.mesh.position.x = 55;
scene.add(mercury.mesh);

const venus = new CosmicObject(5, new THREE.MeshPhongMaterial({color: 0xe0730d}), "Venus",
"Venus is the second planet from the Sun. It is a terrestrial planet and is the closest in mass and size to its orbital neighbour Earth. Venus has by far the densest atmosphere of the terrestrial planets, composed mostly of carbon dioxide with a thick, global sulfuric acid cloud cover.") ;
venus.mesh.position.x = 70;
scene.add(venus.mesh);

let ring1Geo = new THREE.TorusGeometry(55, 0.2, 128, 128);
const ring = new THREE.LineBasicMaterial({color: 0xffffff});
const ring1 =  new THREE.Mesh(ring1Geo, ring);
ring1.rotateX(Math.PI / 2);
scene.add(ring1);
let ring2Geo = new THREE.TorusGeometry(70, 0.2, 128, 128);
const ring2 =  new THREE.Mesh(ring2Geo, ring);
ring2.rotateX(Math.PI / 2);
scene.add(ring2);



let objectsToIntersect = [];
objectsToIntersect.push(sun.mesh);
objectsToIntersect.push(mercury.mesh);
objectsToIntersect.push(venus.mesh);

const meshToCosmicObjectDictionary = {};
meshToCosmicObjectDictionary[sun.mesh.id] = sun;
meshToCosmicObjectDictionary[mercury.mesh.id] = mercury;
meshToCosmicObjectDictionary[venus.mesh.id] = venus;


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

     if(shouldMoveCameraToTarget && cosmicObjectToInspect){
          moveCameraToTarget();
     }

     raycaster.setFromCamera(pointer, camera);
     const intersects = raycaster.intersectObjects(objectsToIntersect, false);
     if(intersects.length > 0){
          pointedCosmicObject = meshToCosmicObjectDictionary[intersects[0].object.id];
     }
     else{
          pointedCosmicObject = null;
     }
     // requestAnimationFrame(animate);
     composer.render();
     // renderer.render( scene, camera ); 


} 

renderer.setAnimationLoop( animate );