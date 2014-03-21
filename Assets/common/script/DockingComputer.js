#pragma strict

var theShip : Transform;

var systemEnabled : boolean = false;


var lockingState : int = NO_SIGNAL;
var hasEntered : boolean = false;

private var NO_SIGNAL : int = 0;
private var LOCKING_SIGNAL : int = 1;
private var SIGNAL_LOCKED : int = 2;

/* Ship enters docking area
 * ship automatically starts tracking this object
 * once aligned, hand back controls to pilot
 * if ship leaves the area then hand back controls
 * show the aligment screen on pilot
 */
function Start () {
	theShip = GameObject.Find("TheShip").transform;
	
}

function Update () {
	if(systemEnabled){
		if(lockingState != NO_SIGNAL){
			//theShip.transform.LookAt(transform);
			var lookAt : Quaternion = Quaternion.LookRotation(-(theShip.position - transform.position));
			theShip.transform.rotation = Quaternion.RotateTowards(theShip.rotation, lookAt, Time.deltaTime * 10f);
			var shipDir : Vector3 = theShip.TransformDirection(Vector3.forward).normalized;
			var direction : float = Vector3.Dot(shipDir, (theShip.position - transform.position).normalized);
			//Debug.Log(direction);
			if(direction <= -0.94f){
				lockingState = SIGNAL_LOCKED;
			} else {
				lockingState = LOCKING_SIGNAL;
			}
		}
	}

}

function OnDrawGizmos(){
	var v : Vector3 = transform.TransformDirection(Vector3.forward);
	
	
	Gizmos.DrawLine(transform.position, transform.position + v * 500);
}



function TurnOn(){
	if(!systemEnabled){
		systemEnabled  = true;
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "dockingtest");
		lockingState = NO_SIGNAL;
		
	}
}

function TurnOff(){
	if(systemEnabled){
		systemEnabled = false;
		OSCHandler.Instance.RevertClientScreen("PilotStation");
	}
}

function Entered(){
	lockingState = LOCKING_SIGNAL;
	hasEntered = true;
	
}

function OnTriggerEnter (c : Collider){
	if(systemEnabled){
		if(c.name == "TheShip"){
			//send out docking screen
			Entered();
			
		}
	}
}

function OnTriggerExit(c : Collider){
	if(systemEnabled){
		if(c.name == "TheShip"){
			//revert the pilot screen to radar
			hasEntered = false;
			lockingState = NO_SIGNAL;
			var m : OSCMessage = OSCMessage("/system/dockingComputer/dockingPosition");
			m.Append(-4.0f);
			m.Append(-4.0f);
			m.Append(-4.0f);
			m.Append(1.0f);
			m.Append(100.0f);
			m.Append(lockingState);
			OSCHandler.Instance.SendMessageToClient("PilotStation", m);
		}
	}
}

function OnTriggerStay(c : Collider){
	if(c.name == "TheShip" ){
		if(systemEnabled){
		
			/* catches the ship being insie the trigger when the comp is activated */
			if(hasEntered == false){
				Entered();
			}
			
		
			
			//send out y,x coords, z is distance to bay
			var shipPos : Vector3 = transform.InverseTransformPoint(theShip.position);
			
			//work out which direction the ship is facing
			var shipDir : Vector3 = transform.InverseTransformDirection(theShip.TransformDirection(Vector3.forward));
			var direction : float = Vector3.Dot(shipDir, transform.TransformDirection(Vector3.forward));
			
			var distance : float = shipPos.magnitude;
			
			var m : OSCMessage = OSCMessage("/system/dockingComputer/dockingPosition");
			m.Append(shipPos.x);
			m.Append(shipPos.y);
			m.Append(shipPos.z);
			m.Append(direction);
			m.Append(distance);
			m.Append(lockingState);
			OSCHandler.Instance.SendMessageToClient("PilotStation", m);
			
		}
	}
	
}