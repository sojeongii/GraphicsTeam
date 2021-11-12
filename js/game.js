// Time Params
var WINDOW_PIXEL_MARGIN = 20;
var CURRENT_TIME, TIME_LAST_FIRE=0, FIRE_DELAY=200;

// Starlight Params
var STARTLIGHT_MOVEMENT_RADIUS=2500 , STARTLIGHT_DISTNACE_TO_ZERO = 5000, STARLIGHT_INTENSITY = 100;
var STARTLIGHT_RADIUS= 300,STARLIGHT_Y = 600, STARTLIGHT_MOVEMENT_SPEED=.03;
var STARLIGHT_COLORS = [0xffffff,0x28E7FF, 0xffff00, 0x00ff00, 0xA30FE2, 0xff0000];

// Camera Params
var CAMERA_X = 0, CAMERA_Y = 1000, CAMERA_Z = 2000;
var CAMERA_LOOKAT = new THREE.Vector3(0,1000,0), CAMERA_FOV=75, CAMERA_NEAR=.1, CAMERA_FAR=5000;

// Game object params
var TERRAIN_WIDTH = 800, TERRAIN_LENGTH = 4000, TERRAIN_Y = 10;
var WATER_WIDTH = 80000, WATER_LENGTH = 80000;
var CITY_ID=1, CITY_SIZE = 100, DISTANCE_BETWEEN_CITY=400;
var MISSILE_BATTERY_ID=1, MISSILE_BATTERY_SIZE = 100;
var BATTERY_LOCATION = [-800, -400, 0, 400, 800];
var BATTERY_able = [false, false, false, false, false];
var OFFENSE_MISSILE_FALL_HEIGHT = 2500, DISTANCE_BETWEEN_OFFENSE_MISSILE_LOCATIONS = 400;


// Missile Params
var MISSILE_ID=1, MISSILE_SIZE=50,  MISSILE_DEFENSE_SPEED=1.05, MISSILE_OFFENSE_SPEED=1.001, MISSILE_OFFENSE_MULTIPLYER=8;

var OFFENSE_SIZE = 70;
// Defense Explosions Params
var DEFENSE_EXPLOSION_SIZE = 100, DEFENSE_EXPLOSION_DURATION_MILISECONDS = 1000 ;

// Stage Params
var CURRENT_STAGE = 0, TOTAL_STAGES=6, SCORE=0;

var NIGHTMARE_MODE;

var ANIMATION_FRAME_ID;

//---------------------------------------------------------------------------------------
// Mouse variables
var raycaster, mouse, INTERSECTED;

// gobal variables for rendering and game
var renderer, scene, camera, world;
var vector3 = new THREE.Vector3();

const loader = new THREE.TextureLoader();
const backTexture = loader.load('https://p0.pikist.com/photos/411/685/galaxy-star-infinity-cosmos-dark-constellation-universe-starry-sky-astronomy.jpg');

// INITIALIZE -------------------------------------------------------------------
function initGame(){

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xffffff, 0.00005 );//fog
    scene.background = backTexture;//background image

    world = new World(scene);//call graphics..objects..

    raycaster = new THREE.Raycaster();//Monitor all the graphics on the canvas to determine collision.
    mouse = new THREE.Vector2();

    // initialize camera (fov, x, y, z, LookAt, near, far);
    initCamera(CAMERA_FOV,CAMERA_X,CAMERA_Y,CAMERA_Z,CAMERA_LOOKAT, CAMERA_NEAR, CAMERA_FAR);

    // initialize renderer
    initRenderer();

    // Create World Entities
    world.initWorld();

    // add Event Listeners
    window.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);

    requestInputNightmareMode();

    console.log(BATTERY_able);
    // Animate all
    startNextStage();
    animate();
}

// camera
function initCamera(fov,x,y,z,lookAt, near, far){
    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.x = x; // default is 0
    camera.position.y = y; // default is 10
    camera.position.z = z; // default is 25
    camera.lookAt(lookAt);
}

// render
function initRenderer(){
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth-WINDOW_PIXEL_MARGIN, window.innerHeight-WINDOW_PIXEL_MARGIN );
    renderer.setClearColor(0x000000,1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.renderSingleSided = false; // must be set to false to honor double-sided materials

    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);
}

//aimation
var animate = function (now) {
    CURRENT_TIME = now;
    ANIMATION_FRAME_ID = requestAnimationFrame( animate );

    render();
    moveStarLight(); // Rotate the star

    // find intersection
    findMouseIntersection();
    checkMissileDestroyedOrDestinationReached();
    detectCollisions();
    moveAllMissiles();
    removeDestroyedObjectsFromScene();
    updateCanvasElements('');
    runGameLogic();
};

function render(){
    renderer.render(scene, camera);
}

//// Rotate the star
function moveStarLight(){
    var time = CURRENT_TIME*0.005
    var light = world.starLight;

    var lightX = Math.sin( time * STARTLIGHT_MOVEMENT_SPEED ) * STARTLIGHT_MOVEMENT_RADIUS;
    var lightY = Math.cos( time * STARTLIGHT_MOVEMENT_SPEED ) * STARTLIGHT_MOVEMENT_RADIUS;
    var lightZ = Math.cos( time * STARTLIGHT_MOVEMENT_SPEED ) * STARTLIGHT_MOVEMENT_RADIUS;

    light.position.x = lightX;
    //light.position.y = lightY;
    light.position.z = lightZ;

}


//game rule
function runGameLogic(){
    // check if game is over
    if(world.missileBatteries.length==0){
        updateCanvasElements('GAME OVER: YOU LOST');
        cancelAnimationFrame(ANIMATION_FRAME_ID);
    }else{
        // if not check if all the offensive missile are destroyed
        if(world.offenseMissiles.length==0){

            //cancelAnimationFrame(ANIMATION_FRAME_ID);
            //check if stage is the last stage
            if(CURRENT_STAGE==TOTAL_STAGES-1){
                // YOU WON
                SCORE = SCORE + 2000;
                updateCanvasElements('GAME OVER: YOU WON');
                cancelAnimationFrame(ANIMATION_FRAME_ID);
            }else{
                CURRENT_STAGE++;
                SCORE = SCORE + 1000; // on completing a stage add 1000 to score
                startNextStage();
            }
        }
    }
}

// Creates Offense Missiles
// Updates the color of the sun
// starts animation
function startNextStage(){
    world.fireOffenseMissiles((CURRENT_STAGE+1)*MISSILE_OFFENSE_MULTIPLYER);
    // Update the sun.
    var hemiLight = world.hemiLight;
    world.scene.remove(hemiLight);

    var starLight = world.starLight;
    world.scene.remove(starLight);

    var moon = world.moon;
    world.scene.remove(moon);

    world.createPointLights();
}

// explode the passed missile
function removeMissile(missile){
    missile.isDestoryed = true;
    if(missile.type=='defense'){
        for(var i=0;i<world.defenseMissiles.length;i++){
            var currentMissile = world.defenseMissiles[i];
            if(currentMissile.id==missile.id){
                //console.log('defense missile removed');
                world.missilesToBeRemoved.push(currentMissile);
                //animateExplosion(currentMissile);
                world.defenseMissiles.splice(i,1);
            }
        }
    }else{
        for(var i=0;i<world.offenseMissiles.length;i++){
            var currentMissile = world.offenseMissiles[i];
            if(currentMissile.id==missile.id){
                //console.log('offense missile removed');
                world.missilesToBeRemoved.push(currentMissile);
                //animateExplosion(currentMissile);
                world.offenseMissiles.splice(i,1);
            }
        }

    }
}

// remove the missile battery
function removeMissileBattery(missileBattery){
    missileBattery.isDestoryed = true;
    for(var i=0; i<world.missileBatteries.length; i++){
        var currentMissileBattery = world.missileBatteries[i];
        if(currentMissileBattery.id == missileBattery.id){
            var index = BATTERY_LOCATION.indexOf(missileBattery.position.x);
            BATTERY_able[index] = true;
            console.log(missileBattery.position);
            world.missileBatteriesToBeRemoved.push(missileBattery);
            world.missileBatteries.splice(i,1);
            console.log(BATTERY_able);
        }
    }
}
//recover missile battery
function recoverMissileBattery(){
    var check = false;
    for(var i=0; i<5; i++){
        if(check != false)
        {
            break;
        }

        if(BATTERY_able[i] == true){
           world.missileBatteries.push(world.createMissileBattery(new THREE.Vector3(BATTERY_LOCATION[i],1,0)));
           BATTERY_able[i] = false;
           console.log(BATTERY_able);
           check = true;
        }
    }
}

// move all missiles from source to destination
function moveAllMissiles(){
    // move offenseMissiles
    for(var i=0; i<world.offenseMissiles.length; i++){
        var offenseMissile = world.offenseMissiles[i];
        moveMissile(offenseMissile);
    }

    // move defense Missiles
    for(var i=0;i<world.defenseMissiles.length;i++){
        var defenseMissile = world.defenseMissiles[i];
        moveMissile(defenseMissile);
    }
}

// Move a single missile
function moveMissile(missile){
    missile.position.add(missile.direction.multiplyScalar(missile.speed));

}

// mouse
function findMouseIntersection(){
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects(world.objects);
    if(intersects.length>0){
        INTERSECTED = intersects[0];
    }
}

// update the mouse position
function onMouseMove(event){
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

// fire the missiles on mouse click
function onMouseDown(event){
    var timeNow = CURRENT_TIME;
    // If batteries still exist
    if(world.missileBatteries.length>0){
        // If time since last fire is greater than fire delay, only then fire.
        if((timeNow-TIME_LAST_FIRE)>FIRE_DELAY){
            // Fire Missiles from remaining batteries based on difficulty
            if(NIGHTMARE_MODE){
                // CODE FOR REGULAR TWIN FIRE
                world.missileBatteries.forEach(function (currentMissileBattery) {
                    var origin = currentMissileBattery.position;
                    var destination = INTERSECTED.point;
                    world.fireDefenseMissile(origin,destination);
                });
            }else{
                // fire missiles at the same time.
                world.missileBatteries.forEach(function (currentMissileBattery) {
                    var origin = currentMissileBattery.position;
                    var destination = INTERSECTED.point;
                    world.fireDefenseMissile(origin,destination);
                });
            }

            // waiting time until the next fire.
            TIME_LAST_FIRE = timeNow;
        }else{
           
        }
    }
    else
    {
       console.log("next");
    }

}

// physics

function detectCollisions(){
    // for each defense missile, cast ray from its current position to all the other offense missiles and check intersection.
    // if the intersection points are less than distance between their centers , collision is true.

    // Check collisions between defense missiles and offense missiles
    world.defenseMissiles.forEach(function(currentDefenseMissile){
        var validMinRadius = MISSILE_SIZE*2;
        var hasDefenseMissileCollided = false;
        var originPoint = currentDefenseMissile.position.clone();
        // check with collision for each offense missile by comapring the distance between their centers
        world.offenseMissiles.forEach(function (currentOffenseMissile) {
            var destinationPoint = currentOffenseMissile.position.clone();
            var distanceBetweenCenters = destinationPoint.distanceTo(originPoint);
          
            if(distanceBetweenCenters<=validMinRadius){
                hasDefenseMissileCollided = true;
                if(currentOffenseMissile.type == 'normal')
                {
                    SCORE = SCORE + 20;
                }
                else if(currentOffenseMissile.type == 'healing')
                {
                    recoverMissileBattery();
                }
                removeMissile(currentOffenseMissile);
            }
        });
        // All the offense missiles have been checked for in this pass, can mark defense missile as removed
        // If defense missile has collided
        if(hasDefenseMissileCollided){
            var defenseExplosion = world.createDefenseExplosion(currentDefenseMissile.position);
            world.defenseMissileExplosionsToBeRemoved.push(defenseExplosion);
            removeMissile(currentDefenseMissile);
        }
    });

    // check collisions between defense explosions and offense missiles
    world.defenseMissileExplosionsToBeRemoved.forEach(function(currentDefenseExplosion){
        var validMinRadius = MISSILE_SIZE + DEFENSE_EXPLOSION_SIZE;
        var originPoint = currentDefenseExplosion.position.clone();
        world.offenseMissiles.forEach(function (currentOffenseMissile){
            var destinationPoint = currentOffenseMissile.position.clone();
            var distanceBetweenCenters = destinationPoint.distanceTo(originPoint);
            if(distanceBetweenCenters<=validMinRadius){
                SCORE = SCORE + 20;
                removeMissile(currentOffenseMissile);
            }
        });
    });


    // check collision between offense missiles and missileBatteries
    world.missileBatteries.forEach(function (currentMissileBattery) {
        var validMinRadius = MISSILE_SIZE+MISSILE_BATTERY_SIZE;
        var originPoint = currentMissileBattery.position.clone();
        world.offenseMissiles.forEach(function (currentOffenseMissile) {
            var destinationPoint = currentOffenseMissile.position.clone();
            var distanceBetweenCenters = destinationPoint.distanceTo(originPoint);
            if(destinationPoint.x == 0 && destinationPoint.y == 0 && destinationPoint.z == 0)
            {
                console.log(destinationPoint);
                console.log(originPoint, distanceBetweenCenters, validMinRadius);
                console.log("nocollision")
            }
            else
            {
                if(distanceBetweenCenters<=validMinRadius){
                    SCORE = SCORE -100;
                    console.log("collision")
                    console.log(destinationPoint.x);
                    removeMissile(currentOffenseMissile);
                    removeMissileBattery(currentMissileBattery);
                }
            }
        });
    });
}

function checkMissileDestroyedOrDestinationReached(){
    // for offenseMissiles
    for(var i=0; i<world.offenseMissiles.length; i++){
        var offenseMissile = world.offenseMissiles[i];
        // if missile is not destroyed and not reached terrain, move it
        if(offenseMissile.isDestoryed || offenseMissile.position.y<0){
            removeMissile(offenseMissile);
        }
    }

    // for defense Missiles
    for(var i=0;i<world.defenseMissiles.length;i++){
        var defenseMissile = world.defenseMissiles[i];
        if(defenseMissile.isDestoryed || (defenseMissile.position.y >= defenseMissile.destination.y)){
            var defenseExplosion = world.createDefenseExplosion(defenseMissile.position);
            world.defenseMissileExplosionsToBeRemoved.push(defenseExplosion);
            removeMissile(defenseMissile);
        }
    }
}

// remove objects
// Remove all the destroyed objects from the scene
function removeDestroyedObjectsFromScene(){

    removeDefenseExplosionsFromScene();

    removeDestroyedMissilesFromScene();

    removeDestroyedMissileBatteriesFromScene();

}

// save not eligible explosions in a temp list, empty the list and replace the eligible ones.
function removeDefenseExplosionsFromScene(){
    var temp=[];
    // Traverse , delete eligible explosions , save others to temp and replace with the new list
    world.defenseMissileExplosionsToBeRemoved.forEach(function(currentExplosion){
        if(currentExplosion.removeAtTime <= CURRENT_TIME){ // remove the object
            world.scene.remove(currentExplosion);
            currentExplosion.geometry.dispose();
            currentExplosion.material.dispose();
        }else{
            temp.push(currentExplosion);
        }
        world.defenseMissileExplosionsToBeRemoved = [];
        world.defenseMissileExplosionsToBeRemoved = temp;
    });
}

// remove all dead missiles from the scene.
function removeDestroyedMissilesFromScene(){
    world.missilesToBeRemoved.forEach(function(currentMissile){
        world.scene.remove(currentMissile);
        currentMissile.geometry.dispose();
        currentMissile.material.dispose();
    });
    world.missilesToBeRemoved=[];

}

// remove dead missile Batteries From Scene
function removeDestroyedMissileBatteriesFromScene(){
    world.missileBatteriesToBeRemoved.forEach(function (currentMissileBattery) {
        world.scene.remove(currentMissileBattery);
        currentMissileBattery.geometry.dispose();
        currentMissileBattery.material.dispose();
    });
    world.missileBatteriesToBeRemoved=[];
}

//check window resize options
function onWindowResize() {
    //camera.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

//difficulty
function requestInputNightmareMode(){
    NIGHTMARE_MODE = window.confirm('Do you want HARD version??');
    if(NIGHTMARE_MODE){
        MISSILE_OFFENSE_SPEED = 1.005;
        MISSILE_OFFENSE_MULTIPLYER = 10;
        DEFENSE_EXPLOSION_SIZE = 100;
        MISSILE_SIZE =30;
    }else{
        MISSILE_OFFENSE_SPEED = 1.001;
        MISSILE_OFFENSE_MULTIPLYER = 8;
        DEFENSE_EXPLOSION_SIZE = 100;
        MISSILE_SIZE =50;
    }

    var img = document.getElementsByClassName('startImage');
    for (var i=0;i<img.length;i+=1){
        img[i].style.display = 'none';
    }

    
}


function updateCanvasElements(message){
    document.getElementById('scoreNumber').innerHTML = SCORE.toString();
    document.getElementById('stageNumber').innerHTML = CURRENT_STAGE.toString();
    if(message!=''){
        document.getElementById('instructions').innerHTML = message;
    }
}