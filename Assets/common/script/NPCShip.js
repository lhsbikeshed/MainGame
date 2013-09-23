#pragma strict

var waypointList : List.<SequenceWaypoint>;
var nextWaypoint: SequenceWaypoint;
private var waypointIndex : int = 0;

var startTest : boolean = false;
var rotationDamping : float = 1.0f;
var maxVelocity : float = 15.0f;

private var running : boolean = false;
private var velocity : float = 0.0f;

 var reactorRunning : boolean = false;


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
				bf.blinking = false;
			}
			reactorRunning = false;
		}
	}
}

function Update () {
	if(reactorRunning){
		engineParticles.emissionRate = 50 + (velocity / maxVelocity) * 350;
		engineLight.intensity = 1 + (velocity / maxVelocity) * 3.5;
	}
	
	
	if(startTest){
		startTest = false;
		StartFlight();
	}
	if(running){
		
		//var velocity : float = nextWaypoint.newVelocity;
		var dist : float = Mathf.Abs( (nextWaypoint.transform.position - transform.position).magnitude) ;
		velocity = Mathf.Clamp(dist,0,maxVelocity);
		velocity *= Mathf.Abs(Vector3.Dot((transform.position - nextWaypoint.transform.position).normalized, transform.TransformDirection(Vector3.forward)));
		rigidbody.AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
		var rotation = Quaternion.LookRotation(nextWaypoint.transform.position - transform.position);
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
	}
		
	/*
		
			velocity = 40 + (targetTransform.rigidbody.velocity.magnitude * 0.8f) + randVel;
			velocity *= Mathf.Abs(Vector3.Dot((transform.position - targetTransform.position).normalized, transform.TransformDirection(Vector3.forward)));
			
			transform.Translate(Vector3.forward * velocity * Time.deltaTime);
			var rotation = Quaternion.LookRotation(targetTransform.position - transform.position);
	
	        transform.rotation = Quaternion.Slerp(transform.rotation, rotation, Time.deltaTime * damping);
	        lifeTime -= Time.deltaTime;
	        if(lifeTime <= 0){
	        	explode();
	        }
			
		}
		//close to waypoint? Go to next one
		var dist : float = Mathf.Abs( (targetTransform.position - transform.position).magnitude) ;
		if( dist > maxDistance ){
			explode();
		} 
		*/

}