#pragma strict

var waypointList : List.<SequenceWaypoint>;
var nextWaypoint: SequenceWaypoint;
private var waypointIndex : int = 0;

var startTest : boolean = false;
var rotationDamping : float = 1.0f;
var maxVelocity : float = 15.0f;


var running : boolean = false;
private var velocity : float = 0.0f;

var theShip : Transform;




function Start () {
	
		var ship : Transform = GameObject.Find("TheShip").transform;
		theShip = ship;
		
}

function StartFlight(){
	if(waypointList.Count == 0){
		Debug.Log("Autopilot started with no waypoints");
		return;
	}
	nextWaypoint = waypointList[0];
	running = true;
	waypointIndex = 0;
	theShip.GetComponent.<ShipCore>().setControlLock(true);
	
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
	theShip.GetComponent.<ShipCore>().setControlLock(false);
}

function isRunning() : boolean {
	return running;
}

function AddWaypoint(wp : SequenceWaypoint){
	waypointList.Add(wp);
}



function Update () {
	
	if(startTest){
		startTest = false;
		StartFlight();
	}
	

}

function FixedUpdate(){
	if(running){
		
		//var velocity : float = nextWaypoint.newVelocity;
		var dist : float = Mathf.Abs( (nextWaypoint.transform.position - theShip.transform.position).magnitude) ;
		velocity = Mathf.Clamp(dist,0,maxVelocity);
		velocity *= Mathf.Abs(Vector3.Dot((theShip.transform.position - nextWaypoint.transform.position).normalized, theShip.transform.TransformDirection(Vector3.forward)));
		
		theShip.rigidbody.AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
		
		var rotation = Quaternion.LookRotation(nextWaypoint.transform.position - theShip.transform.position, nextWaypoint.transform.TransformDirection(Vector3.up));
		//rotation.eulerAngles.z = 0;
		theShip.transform.rotation = Quaternion.Slerp(theShip.transform.rotation, rotation, Time.deltaTime * rotationDamping);
		
		
		if( dist < nextWaypoint.sensorDistance && nextWaypoint.visited == false ){
			Debug.Log("Reached waypoint: " + waypointIndex);
			nextWaypoint.visited = true;
			if(nextWaypoint.OnArrive != null){
				nextWaypoint.OnArrive(gameObject);
			}
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
}