//Class for moving objects.
class CustomSinCurve extends THREE.Curve {

    constructor( scale = 1 ) {

        super();

        this.scale = scale;

    }

    getPoint( t, optionalTarget = new THREE.Vector3() ) {

        const tx = t * 3 - 1.5;
        const ty = Math.sin( 2 * Math.PI * t );
        const tz = 0;

        return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );

    }

}

//call all graphics
function World(scene){
    this.scene = scene;

    this.cities = [];
    this.missileBatteries = [];
    this.offenseMissiles = [];
    this.defenseMissiles = []

    this.offenseMissileLocations = [];
    this.cityLocations = [];
    this.missileBatteryLocations = [];

    this.defenseMissileExplosionsToBeRemoved = [];
    this.missilesToBeRemoved = [];
    this.citiesToBeRemoved =[];
    this.missileBatteriesToBeRemoved = [];

    // object for getting mouse pointer
    this.objects = [];

    this.initWorld = function(){

        // Add the Point lights
        this.createPointLights();
        this.setupOffenseMissileLocations(OFFENSE_MISSILE_FALL_HEIGHT,DISTANCE_BETWEEN_OFFENSE_MISSILE_LOCATIONS);
        this.setupMissileBatteryLocations();

        // plane to check for mouse(invisible)
        this.createVerticalGamePlane()

        // Add the terrain
        this.createTerrain(0,TERRAIN_Y,0);

        // Add MissileBatteries
        for(var i=0;i<this.missileBatteryLocations.length;i++){
            this.missileBatteries.push(this.createMissileBattery(this.missileBatteryLocations[i]));
        }

    };

    // missile batteries
    this.setupMissileBatteryLocations = function () {
        this.missileBatteryLocations.push(new THREE.Vector3(BATTERY_LOCATION[0],1,0));
        this.missileBatteryLocations.push(new THREE.Vector3(BATTERY_LOCATION[1],1,0));
        this.missileBatteryLocations.push(new THREE.Vector3(BATTERY_LOCATION[2],1,0));
        this.missileBatteryLocations.push(new THREE.Vector3(BATTERY_LOCATION[3],1,0));
        this.missileBatteryLocations.push(new THREE.Vector3(BATTERY_LOCATION[4],1,0));
    };
    // offense Missile starting Location
    this.setupOffenseMissileLocations = function (fromHeight, gapBetween) {
        this.offenseMissileLocations.push(new THREE.Vector3(-4*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(-3*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(-2*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(-1*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(0,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(2*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(3*gapBetween,fromHeight,0));
        this.offenseMissileLocations.push(new THREE.Vector3(4*gapBetween,fromHeight,0));
    };

   
    // create invisible plane for mouse position
    this.createVerticalGamePlane = function(){
        var geometry = new THREE.PlaneBufferGeometry( 5000, 5000 );
        var plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
        this.scene.add( plane );
        this.objects.push( plane);
    };

    // missile batteries prop(gray rectangle)
    this.createTerrain = function(x,y,z){
        // Add Floor Material
        var TerrainMat = new THREE.MeshStandardMaterial( {
            roughness: 0.8,
            color: 0x666666,
            metalness: 0.2,
            bumpScale: 0.0005
        });

        var terrainGeometry = new THREE.BoxBufferGeometry( TERRAIN_LENGTH, TERRAIN_WIDTH,30 );
        var terrain = new THREE.Mesh( terrainGeometry, TerrainMat );
        terrain.receiveShadow = true;
        terrain.rotation.x = -Math.PI / 2.0;
        terrain.position.set(x,y,z);
        this.scene.add( terrain );
        return terrain;
    };

    this.createPointLights = function(){
        // Add HemisphereLight
        this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
        this.scene.add( this.hemiLight );

      
        const loader = new THREE.TextureLoader();
        var starMaterial = new THREE.MeshPhongMaterial({
         
		    color: STARLIGHT_COLORS[CURRENT_STAGE],
			emissiveIntensity: 1,
            map:loader.load("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-7dapYyoKbRnkXD-vDiPWphgr6kv_bNQpgw&usqp=CAU")
        })
        var starGeometry = new THREE.SphereGeometry( STARTLIGHT_RADIUS, 16, 16 );

        this.starLight = new THREE.PointLight( STARLIGHT_COLORS[CURRENT_STAGE], STARLIGHT_INTENSITY*(CURRENT_STAGE+1), STARTLIGHT_DISTNACE_TO_ZERO, 2 );
        this.starLight.add( new THREE.Mesh( starGeometry, starMaterial ) );
        this.starLight.position.set( 0, STARLIGHT_Y, STARTLIGHT_MOVEMENT_RADIUS );
        this.starLight.castShadow = true;
        this.starLight.shadow.mapSize.width = 1024;
        this.starLight.shadow.mapSize.height = 1024;
        this.starLight.shadow.camera.far = 5000;
        this.scene.add( this.starLight );
    };
    // Create and add a missile battery
    this.createMissileBattery = function(location){
        var missileBatteryMaterial = new THREE.MeshStandardMaterial( {
            color: 0x0000ff,
            roughness: 0.7,
            bumpScale: 0.002,
            metalness: 0.5
        });
        var missileBatteryGeometry = new THREE.SphereGeometry( MISSILE_BATTERY_SIZE, 32, 32 );

        var missileBattery = new THREE.Mesh(missileBatteryGeometry , missileBatteryMaterial );
        missileBattery.position.set( location.x, location.y, location.z );
        missileBattery.castShadow = true;
        missileBattery.id = MISSILE_BATTERY_ID;
        MISSILE_BATTERY_ID++;
        this.scene.add( missileBattery );

        // Add default game params and return
        missileBattery.isDestoryed = false;
        return missileBattery;
    };



    // Missile, target object.
    //offensive - target(come from top) defensive - missile(come from bottom)
    this.createMissile = function(origin, destination, type){
        var missileMaterial = new THREE.MeshStandardMaterial( {
            //color: 0xff0000,
            roughness: 0.7,
            bumpScale: 0.002,
            metalness: 0.5
        });

        var missileGeometry;
        var speed;

         if(type=='defense'){
            missileGeometry = new THREE.ConeGeometry( MISSILE_SIZE, 64, 32 );
            missileMaterial.color = new THREE.Color(0x00ff00);
            speed = MISSILE_DEFENSE_SPEED;
        }
        else if(type == 'normal'){
            const path = new CustomSinCurve( 60 );
            missileGeometry = new THREE.TubeGeometry( path, 55, 28, false );
           // missileMaterial.color = new THREE.Color(0xff0000);
            speed = MISSILE_OFFENSE_SPEED;
           const loader = new THREE.TextureLoader();
            missileMaterial = new THREE.MeshBasicMaterial({
                map:loader.load('data:image/jpeg;base64,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')

            })

        }
        else if(type == 'healing')
        {
            missileGeometry = new THREE.IcosahedronGeometry( OFFENSE_SIZE, 0 );
            missileMaterial.color = new THREE.Color(0xbecdff);
            speed = MISSILE_OFFENSE_SPEED;
        }

        var missile = new THREE.Mesh(missileGeometry , missileMaterial);
        missile.position.set( origin.x,origin.y, origin.z );
        missile.castShadow = false;
        // Add default game params and return
        missile.id = MISSILE_ID;
        MISSILE_ID++;
        missile.isDestoryed = false;
        missile.origin = origin;
        missile.destination = destination;
        missile.direction = new THREE.Vector3().subVectors(destination, origin).normalize();
        missile.type = type;
        missile.speed = speed;

        this.scene.add( missile );
        return missile;
    };

    // missile collision.
    this.createDefenseExplosion = function (center) {
        var defenseExplosionMaterial = new THREE.MeshStandardMaterial( {
            color: 0xffa500,
            roughness: 0.7,
            bumpScale: 0.002,
            metalness: 0.5
        });
        var defenseExplosionGeometry = new THREE.SphereGeometry( DEFENSE_EXPLOSION_SIZE, 32, 32 );

        var defenseExplosion = new THREE.Mesh(defenseExplosionGeometry , defenseExplosionMaterial );
        defenseExplosion.position.set( center.x, center.y, center.z );
        defenseExplosion.castShadow = true;
        // period until the explosion
        defenseExplosion.removeAtTime = CURRENT_TIME + DEFENSE_EXPLOSION_DURATION_MILISECONDS;
        this.scene.add( defenseExplosion );

        // Add default game params and return
        return defenseExplosion;
    };

    
    // fire offense...
    this.fireOffenseMissiles = function (missileCounts) {

        for(var i=1; i<=missileCounts; i++){
            var origin = this.offenseMissileLocations[Math.floor(Math.random()*this.offenseMissileLocations.length)];
            var destination = this.missileBatteryLocations[Math.floor(Math.random()*this.missileBatteryLocations.length)];
          
            var coin = Math.random();
            var type;
            if(coin < 0.5){
                type = 'normal'
            }
            else if(coin > 0.5 && coin < 0.6){
                type = 'healing'
            }

            var currentMissile = this.createMissile(origin, destination, type);
            this.offenseMissiles.push(currentMissile);   
        }
    };

   // fire defense...
    this.fireDefenseMissile = function(origin, destination) {
        var type = 'defense'
        var currentMissile = this.createMissile(origin, destination, type);
        this.defenseMissiles.push(currentMissile);
    };

}
