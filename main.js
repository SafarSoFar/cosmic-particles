import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import {GUI} from 'lil-gui';

// function randomInt(min, max){
//      return Math.floor(Math.random() * (max-min+1)+min);
// }

const scene = new THREE.Scene(); 

const renderer = new THREE.WebGLRenderer(); 
renderer.setClearColor(0x010328);
// scene.add(new THREE.AmbientLight(0x010328));

// renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const controls = new OrbitControls(camera, renderer.domElement );
// controls.update();

// by default no ascii effect
document.body.appendChild( renderer.domElement );

// let directionalLight = new THREE.DirectionalLight(0xffffff, 100);
// scene.add(directionalLight);


let settings = {
     dotsAmount: 400,
     dotTraversalRange: 100,
     dotsRadius: 0.3,
     distanceAffection: 100,
     frictionRate : 0.003,
}

let mousePos = new THREE.Vector3(0,0,0);

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


const gui = new GUI();
gui.add(settings, "distanceAffection", 50, 300, 10);
gui.add(settings, "frictionRate", 0.003, 0.01);
gui.add(settings, "dotsAmount", 100, 7000).onChange(value => changeDotsAmount(value));


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


class Dot{
     constructor(geometry){
          // let dotMaterial =  new THREE.MeshPhongMaterial();
          // dotMaterial.color = new THREE.Color(dotColors[randInt(0,1)]);

          let dotMaterial =  new THREE.MeshBasicMaterial();
          dotMaterial.color = dotColors[randInt(0,1)];
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
     // console.log("X" + mousePos.x);
     // console.log("Y:" + mousePos.y);
     // console.log("Z:" + mousePos.z);

}


for(let i = 0; i < settings.dotsAmount; i++){
     dots.push(new Dot(dotGeometry));
     scene.add(dots[i].mesh);
}


camera.position.z = 300;

function animate() {
     for(let i = 0; i < settings.dotsAmount; i++){
          if(dots[i].mesh.position.distanceTo(mousePos) < settings.distanceAffection){
               dots[i].setVelocity();
               // collis
          }

          dots[i].move();
          dots[i].friction();
     }   

     renderer.render( scene, camera ); 


} 

renderer.setAnimationLoop( animate );