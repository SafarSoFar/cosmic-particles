import * as THREE from 'three';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';

class InspectableObject extends THREE.Object3D{
     constructor(mesh, infoName, infoDescription){
          super();
          this.infoName = infoName;
          this.infoDescription = infoDescription;
          this.mesh = mesh;
     }
}

export class SolarSystemObject extends InspectableObject{
     constructor(mesh, infoName, infoDescription){
          super(mesh, infoName, infoDescription);
     }
}

export class SolarSystemBody extends InspectableObject{
     constructor(objectPivot, objectRadius, objectMaterial, infoName, infoDescription){
          let objectGeometry = new THREE.SphereGeometry(objectRadius, 128, 128);
          let mesh = new THREE.Mesh(objectGeometry, objectMaterial);
          super(mesh, infoName, infoDescription);
          this.objectPivot = objectPivot;
          this.objectRadius = objectRadius;
     }
}


let dotColors = [];
dotColors.push(new THREE.Color(0xf9c54b));
dotColors.push(new THREE.Color(0xa891fb));

export class Dot{
    
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