#pragma strict

/* lost van functionality
 * work out where this ship is in the sector coord system and work out a signal strength based on how
 * the player ship is rotated

 
  OUTPUTS: 
	/nebulascene/signalStrength		-- are we aiming the ship in the right direction
	/nebulascene/arrivedInSector	-- have we arrived in the right sector?

*/

var signalStrength : float;
var van : GameObject;
var inSameSector : boolean = false;
var transmitting : boolean = false;

private var dynObj : DynamicMapObject;
private var mapController : MapController;
private var theShip : GameObject;
private var distressSource : AudioSource;

private var ourPos : Vector3;

private var lastUpdateTime : float;
private var lastSoundTime : float;

function Awake () {
	dynObj = van.GetComponent.<DynamicMapObject>();
	mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
	theShip = GameObject.Find("TheShip");
	ourPos = Vector3(dynObj.sectorCoord[0], dynObj.sectorCoord[1], dynObj.sectorCoord[2]);
	distressSource = GetComponent.<AudioSource>();
}

function FixedUpdate () {
	if(transmitting){
		if(lastUpdateTime + 0.1 < Time.fixedTime){
			lastUpdateTime = Time.fixedTime;
			//do a sig strength update and push to clients
		
			signalUpdate();
			
			
		}
	
	
		if(lastSoundTime + 4 < Time.fixedTime && !distressSource.isPlaying){
			lastSoundTime = Time.fixedTime;
			distressSource.Play();
		}
	}
}

function transmitState(state : boolean){
	transmitting = state;
}

function lostShip(){
	transmitting = true;
	OSCHandler.Instance.ChangeClientScreen("TacticalStation", "signalStrength");
	var msg : OSCMessage = OSCMessage("/scene/nebula/lostShip");

	OSCHandler.Instance.SendMessageToAll(msg);
}
	
	
function foundShip(){
	transmitState(false);
	OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");
	var msg : OSCMessage = OSCMessage("/scene/nebula/foundShip");

	OSCHandler.Instance.SendMessageToAll(msg);
}

function signalUpdate(){
	var shipPos : Vector3 ;	
	var direction : Vector3 ;
	
	shipPos = Vector3(mapController.sectorPos[0], mapController.sectorPos[1], mapController.sectorPos[2]);	
	/* WRONG! use the vans original dynamic pos */
	direction  = ((ourPos * 6000 + dynObj.originalPosition) - (shipPos * 6000 + theShip.transform.position)).normalized;
	
	var shipDirection : Vector3 = theShip.transform.rotation * Vector3.forward;
	signalStrength = Mathf.Clamp(Vector3.Dot(shipDirection, direction),0,1.0);
	
	var msg : OSCMessage = OSCMessage("/clientscreen/TacticalStation/signalStrength");
	msg.Append.<float>(signalStrength);
	
	OSCHandler.Instance.SendMessageToAll(msg);
	
	var inSect : boolean = true;
	for(var i = 0; i < 3; i++){
		if(mapController.sectorPos[i] != dynObj.sectorCoord[i]){
			inSect = false;
			break;
		}
		
	}
	if(inSameSector != inSect){
		 msg = OSCMessage("/nebulascene/arrivedInSector");
		msg.Append.<int>(inSect == true ? 1 : 0);
	
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	inSameSector = inSect;
	distressSource.volume = signalStrength;
}