#pragma strict

var theShip : Transform;
var matchTo : Transform;
var ignoringCollisions : boolean  = false;
var stationCollider :  MeshCollider;
public var gravityOn : boolean = false;
var dockingDoor : DoorScript;
var inBay : boolean;

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	
}

function setGravity(st : boolean){
	gravityOn = st;
	var m : OSCMessage = OSCMessage("/scene/launchland/bayGravity");
	m.Append.<int>( st == true ? 1 : 0 );
	OSCHandler.Instance.SendMessageToAll(m);
}

function FixedUpdate(){
	if(gravityOn && theShip.parent == transform){
		theShip.rigidbody.AddForce( transform.rotation * Vector3.up * -300, ForceMode.Force);
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
	if(ignoringCollisions == false && other.name == "TheShip"){
		inBay = true;
		theShip.GetComponent.<PropulsionSystem>().inBay = true;
		ignoringCollisions = true;
		//Physics.IgnoreCollision(theShip.GetComponent.<Collider>(), stationCollider,  true);
		stationCollider.isTrigger = true;
		Debug.Log("Enter : Disabled collider");
		if(theShip.parent == null){	//and were in contact with the docking bay
			theShip.parent = transform;
			if(PersistentScene.networkReady == true){
				networkView.RPC ("Enter", RPCMode.Others);
			}
		}
	}
}

function OnTriggerExit(other: Collider){
	if(ignoringCollisions == true && other.name == "TheShip"){
		inBay = false;
		theShip.GetComponent.<PropulsionSystem>().inBay = false;
		ignoringCollisions = false;
		//Physics.IgnoreCollision(theShip.GetComponent.<Collider>(), stationCollider, false);
		stationCollider.isTrigger = false;
		Debug.Log("leave : enable collider");
		theShip.parent = null;
		
		if(PersistentScene.networkReady == true){
			networkView.RPC ("Exit", RPCMode.Others);
		}
		
	}
}

@RPC
function Enter(){
}
@RPC
function Exit(){}


function Update () {

}