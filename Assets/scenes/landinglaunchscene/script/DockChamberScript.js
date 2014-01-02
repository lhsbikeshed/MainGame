#pragma strict

var theShip : Transform;
var matchTo : Transform;
var ignoringCollisions : boolean  = false;
var stationCollider :  MeshCollider;
public var gravityOn : boolean = false;
var dockingDoor : DoorScript;
var inBay : boolean;

var bayLights : GravityLight[];
var gravitySound : AudioClip;
var gravitySource : AudioSource;

var oxLevel : float = 1.0f;

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	gravitySource = gameObject.AddComponent(AudioSource);
	gravitySource.clip = gravitySound;
	gravitySource.Stop();
	gravitySource.loop = true;
	gravitySource.rolloffMode = AudioRolloffMode.Linear;
	gravitySource.maxDistance = 300;
	
}

function setGravity(st : boolean){
	gravityOn = st;
	var m : OSCMessage = OSCMessage("/scene/launchland/bayGravity");
	m.Append.<int>( st == true ? 1 : 0 );
	OSCHandler.Instance.SendMessageToAll(m);
	
	if(gravityOn){
		for(var l : GravityLight in bayLights){
			l.setState(false);
		}
		gravitySource.Stop();
	} else {
		for(var l : GravityLight in bayLights){
			l.setState(true);
		}
		gravitySource.Play();
	}
}

function FixedUpdate(){
	if(gravityOn && theShip.parent == transform){
		theShip.rigidbody.AddForce( transform.rotation * Vector3.up * -300, ForceMode.Force);
	}
	if(dockingDoor.state != dockingDoor.CLOSED){	//leak some atmosphere if the door isnt closed
		oxLevel -= 0.005f;
		if(oxLevel < 0){
			oxLevel = 0.0f;
		}
	} else {
		oxLevel += 0.01f;
		if(oxLevel > 1.0f){
			oxLevel = 1.0f;
		}
	}
	if(inBay){
		gravitySource.volume = oxLevel;
	} else {
		gravitySource.volume = 0.0f;
	}
	
}

function OnTriggerStay(other : Collider){
	//if(theShip.parent == null){	
	//	Debug.Log ("Stay");
	//	theShip.parent = transform;
	//}

}

@RPC
function openDoor(){
	
	if (dockingDoor != null){ 


		dockingDoor.openDoor();
		if(PersistentScene.networkReady == true){
			networkView.RPC ("openDoor", RPCMode.Others);
		}
	}
	

}

@RPC
function closeDoor(){
	if (dockingDoor != null){ 
		dockingDoor.closeDoor();
		if(PersistentScene.networkReady == true){
			networkView.RPC ("closeDoor", RPCMode.Others);
		}
	}
}

function OnTriggerEnter(other : Collider){
	
	if(other.attachedRigidbody.transform.name == "TheShip"){
		inBay = true;
		theShip.GetComponent.<PropulsionSystem>().inBay = true;
		ignoringCollisions = true;
		
		stationCollider.isTrigger = true;
		Debug.Log("Enter : Disabled collider");
		if(theShip.parent == null){	//and were in contact with the docking bay
			theShip.parent = transform;
			if(PersistentScene.networkReady == true){
				networkView.RPC ("Enter", RPCMode.Others);
			}
		}
	} else {
		other.attachedRigidbody.transform.parent = transform;
	}

}

function OnTriggerExit(other: Collider){
	
	if(other.attachedRigidbody.transform.name == "TheShip"){
		inBay = false;
		theShip.GetComponent.<PropulsionSystem>().inBay = false;
		ignoringCollisions = false;
		
		stationCollider.isTrigger = false;
		Debug.Log("leave : enable collider");
		theShip.parent = null;
		
		if(PersistentScene.networkReady == true){
			networkView.RPC ("Exit", RPCMode.Others);
		}
	} else {
		other.attachedRigidbody.transform.parent = null;
	}
	
}

@RPC
function Enter(){
}
@RPC
function Exit(){}


function Update () {

}