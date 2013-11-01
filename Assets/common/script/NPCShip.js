#pragma strict

var waypointList : List.<SequenceWaypoint>;
var nextWaypoint: SequenceWaypoint;
private var waypointIndex : int = 0;

var startTest : boolean = false;
var rotationDamping : float = 1.0f;
var maxVelocity : float = 15.0f;

var shipsLaser : ShipsLaser;
private var laserCooldown : float = 1.0f;

private var running : boolean = false;
private var velocity : float = 0.0f;

 var reactorRunning : boolean = false;

private var jumping : boolean = false;

//refs
var engineParticles : ParticleSystem;
var engineLight : Light;


function Start () {
	engineParticles.emissionRate = 0.0;
	engineLight.intensity = 0.0f;
}

function StartFlight(){
	if(waypointList.Count == 0){
		Debug.Log("Autopilot started with no waypoints");
		return;
	}
	nextWaypoint = waypointList[0];
	running = true;
	waypointIndex = 0;
	
}

function startJump(){
	if(!jumping){
		gameObject.Find("JumpEffects").GetComponent.<ParticleSystem>().enableEmission = true;
		jumping = true;
	}
}
	
	
function SetAutopilotRoute(container : GameObject){
	var wl : SequenceWaypoint[] = container.GetComponentsInChildren.<SequenceWaypoint>();
	waypointList.Clear();
	for(var w : SequenceWaypoint in wl){
		waypointList.Add(w);
	}
	
}

function PauseFlight(){
	running = false;
}

function isRunning() : boolean {
	return running;
}

function AddWaypoint(wp : SequenceWaypoint){
	waypointList.Add(wp);
}

function SetReactorState(newState : boolean){
	if(newState != reactorRunning){
		if(newState){
			engineParticles.emissionRate = 50 ;
			engineLight.intensity = 1 ;
			for(var bf in GetComponentsInChildren.<BlinkenFlareBehaviour>()){
				bf.blinking = true;
			}
			reactorRunning = true;
		
		} else {
			engineParticles.emissionRate = 0;
			engineLight.intensity = 0;
			for(var bf in GetComponentsInChildren.<BlinkenFlareBehaviour>()){
				bf.flickerAndDie();
			}
			reactorRunning = false;
		}
	}
}

function OnTriggerEnter(c : Collider){
	var target  = c.GetComponent.<TargettableObject>();
	if(target != null && shipsLaser.getState() == 0 && target.damageable == true){
		shipsLaser.npcFireAtTarget(c.transform);
	}
}


function Update () {
	if(reactorRunning){
		engineParticles.emissionRate = 50 + (velocity / maxVelocity) * 350;
		engineLight.intensity = 1 + (velocity / maxVelocity) * 3.5;
	}
	
	
	if(startTest){
		startTest = false;
		startJump();
	}
	

}

function FixedUpdate(){
	if(running){
		
		//var velocity : float = nextWaypoint.newVelocity;
		var dist : float = Mathf.Abs( (nextWaypoint.transform.position - transform.position).magnitude) ;
		velocity = Mathf.Clamp(dist,0,maxVelocity);
		velocity *= Mathf.Abs(Vector3.Dot((transform.position - nextWaypoint.transform.position).normalized, transform.TransformDirection(Vector3.forward)));
		rigidbody.AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
		var rotation = Quaternion.LookRotation(nextWaypoint.transform.position - transform.position);
		rotation.eulerAngles.z = 0;
		transform.rotation = Quaternion.Slerp(transform.rotation, rotation, Time.deltaTime * rotationDamping);
		
		
		if( dist < nextWaypoint.sensorDistance && nextWaypoint.visited == false ){
			Debug.Log("Reached waypoint: " + waypointIndex);
			nextWaypoint.visited = true;
			
			nextWaypoint.OnArrive(gameObject);
			if(waypointIndex + 1 >= waypointList.Count){
				running = false;
				velocity = 0;
			} else {
				
				waypointIndex ++;
				nextWaypoint = waypointList[waypointIndex];
				maxVelocity = nextWaypoint.newVelocity;
			}
			
			
			
		}
	} else if (jumping){
		rigidbody.AddRelativeForce(Vector3.forward * 500, ForceMode.Acceleration);
	}
}