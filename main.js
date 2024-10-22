import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { clamp, randFloat, randInt } from 'three/src/math/MathUtils.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import {GUI} from 'lil-gui';

// function randomInt(min, max){
//      return Math.floor(Math.random() * (max-min+1)+min);
// }

const scene = new THREE.Scene(); 

const renderer = new THREE.WebGLRenderer(); 

// renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

// const controls = new OrbitControls(camera, renderer.domElement );
// controls.update();

// by default no ascii effect
document.body.appendChild( renderer.domElement );


let settings = {
     dotsAmount: 1000,
     dotTraversalRange: 100,
     dotsRadius: 1,
}

let mousePos = new THREE.Vector3(0,0,0);

let dots = [];

let dotGeometry = new THREE.SphereGeometry(settings.dotsRadius); 
let dotMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 

function changeDotsAmount(value){
     for(let i = 0; i < dots.length; i++){
          scene.remove(dots[i].mesh);
     }
     dots = [];

     for(let i = 0; i < value; i++){
          dots.push(new Dot(dotGeometry, dotMaterial));
          scene.add(dots[i].mesh);
     }
}


const gui = new GUI();


function changeDotsRadius(radius){
     dotGeometry = new THREE.SphereGeometry(radius); 
     for(let i = 0; i < settings.dotsAmount; i++){
          scene.remove(dots[i].mesh);
     }
     dots = [];

     for(let i = 0; i < settings.dotsAmount; i++){
          dots.push(new Dot(dotGeometry, dotMaterial));
          scene.add(dots[i].mesh);
     }
}


class Dot{
     constructor(geometry, material){
          this.mesh = new THREE.Mesh(geometry, material);

          this.mesh.position.set(randInt(-window.innerWidth/4,window.innerWidth/4), randInt(-window.innerHeight/4,window.innerHeight/4), randInt(0,100));
     }

     move(){
          this.mesh.position.x = this.mesh.position.x + mousePos.normalize().x;
          this.mesh.position.y = this.mesh.position.y + mousePos.normalize().y;// + mousePos.normalize.y * 0.001;
          // this.mesh.position.z = this.mesh.position.z + mousePos.normalize().z;

     }
     getRandPos(){
          return new THREE.Vector3(randInt(-settings.dotTraversalRange,settings.dotTraversalRange), 
          randInt(-settings.dotTraversalRange,settings.dotTraversalRange), 
          randInt(-settings.dotTraversalRange,settings.dotTraversalRange));
     }

}



document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
     
    var keyCode = event.which;
    if (keyCode == 72) { // 'h' ascii value
        gui.show(gui._hidden);
    }
};

document.addEventListener("mousemove", onDocumentMouseMove, false);
function onDocumentMouseMove(event){
     event.preventDefault();
	mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
	mousePos.y = - (event.clientY / window.innerHeight) * 2 + 1;

 // Make the sphere follow the mouse
  var vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
	vector.unproject( camera );
	var dir = vector.sub( camera.position ).normalize();
	var distance = - camera.position.z / dir.z;
	mousePos = camera.position.clone().add( dir.multiplyScalar( distance ) );
}


for(let i = 0; i < settings.dotsAmount; i++){
     dots.push(new Dot(dotGeometry, dotMaterial));
     scene.add(dots[i].mesh);
}


camera.position.z = 300;

function animate() {
     for(let i = 0; i < settings.dotsAmount; i++){
          dots[i].move();
     }   

     renderer.render( scene, camera ); 

} 

renderer.setAnimationLoop( animate );