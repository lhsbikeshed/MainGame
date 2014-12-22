#pragma strict


var rockPrefabs : Transform[];
var poolSize : int = 20;

var spawnArea : Bounds;
var velAdjust : float = 1;

private var rockPool  :Transform[];


var spawnRate : float = 1;
var initialSpeed : float = 20f;

private var lastSpawnTime : float;
private var nextSpawnTime : float;
private var theShip : Transform;

private var startPosition : Vector3;
private var bastardCooldown : float = 0;

private var spawnRocks: boolean = true;

private var ourPlane : Plane;
private var particles : ParticleSystem;


function Start () {
	theShip = GameObject.Find("TheShip").transform;
	startPosition = transform.position;
	rockPool = new Transform[poolSize];
	
	//fill the pool
	for(var i = 0; i < poolSize; i++){
		var t : Transform = Instantiate(rockPrefabs [ Random.Range(0, rockPrefabs.length) ] , Vector3(0,0,-10000), Quaternion.identity);
		t.gameObject.SetActive(false);
		
		rockPool[i] = t;
	}
	
	ourPlane = new Plane(transform.forward, transform.position);
	particles = GetComponentInChildren.<ParticleSystem>();
}

function OnDisable(){
	for(var t : Transform in rockPool){
		t.gameObject.SetActive (false);
		
	}
}



/* update the rate at which we spawn rocks */
function setRate(newRate : float){
	if(newRate <= 0.1f){
		spawnRocks = false;
		particles.enableEmission = false;

	} else {
		spawnRocks = true;
		particles.enableEmission = true;

		spawnRate = newRate;
		nextSpawnTime = 1/spawnRate;
	}
}

function FixedUpdate () {
	//scale the rate of particles depending on rock spawn rate
	particles.emissionRate = UsefulShit.map(spawnRate, 0.0f, 10f, 0f, 400f);
	
	//prevent GM from spamming the bastard spawner
	bastardCooldown -= Time.fixedDeltaTime;
	
	//match positions with the ship but move ahead of them so there is always rocks in its path
	var pos : Vector3 = theShip.position + theShip.rigidbody.velocity * velAdjust;	
	pos.z = startPosition.z;
	transform.position = pos;
	
	//spawn rocks
	if(spawnRocks){
		if(Time.fixedTime - lastSpawnTime > nextSpawnTime){
			lastSpawnTime = Time.fixedTime;
			nextSpawnTime =  1/spawnRate;
			spawnNew();	
		}
	}

}

function spawnInFrontOfPlayer(){
	if(bastardCooldown < 0.0f){
		var t : Transform = findFreeFromPool();
		if(t != null){
			t.position = Vector3(theShip.position.x, theShip.position.y, startPosition.z) + Random.onUnitSphere * 15f;
			t.gameObject.SetActive(true);
			t.rigidbody.velocity = Vector3.forward * initialSpeed;
			bastardCooldown = 1f;
		}
		
	}

}


function spawnNew(){
	var t : Transform = findFreeFromPool();
	if(t != null){
		var newpos : Vector3 = Vector3(Random.value * spawnArea.size.x, Random.value * spawnArea.size.y, Random.value * spawnArea.size.z) + transform.position - spawnArea.size / 2f;
		t.GetComponent.<TargettableObject>().setPosition(newpos);
		
		t.gameObject.SetActive(true);
		var randRot : Quaternion = Quaternion.Euler(Random.Range(-5, 5), Random.Range(-5,5),0);
		
		t.rigidbody.velocity = randRot * Vector3.forward * (initialSpeed + Random.Range(-5,15));
	}
}

function findFreeFromPool() : Transform {
	for(var t : Transform in rockPool){
		if(t.gameObject.activeInHierarchy == false){
			return t;
		}
	}
	return null;
	

}


function OnDrawGizmosSelected(){
	Gizmos.DrawWireCube(transform.position + spawnArea.center, spawnArea.size);
}