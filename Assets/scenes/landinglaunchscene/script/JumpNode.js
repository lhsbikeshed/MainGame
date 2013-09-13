#pragma strict

var destinationScene : int;
var jumpNodeFrequency : int;
var forcedFail : boolean; //do we force a failure on this jump?
var tunnelGate : boolean = false;
var destinationSector : int[];

private var theShip : GameObject;
private var oscSender : OSCSystem;



function Start () {
	theShip = GameObject.Find("TheShip");
	oscSender = GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>();
}
function OnTriggerEnter (other : Collider) {
	
	if (other.gameObject == theShip){
		theShip.GetComponent.<ship>().inGate = true;
		theShip.GetComponent.<ship>().inTunnelGate = tunnelGate;
		theShip.GetComponent.<ship>().updateJumpStatus();
		
		theShip.GetComponent.<ship>().jumpDest = 1;
		var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
		ps.hyperspaceDestination = destinationScene;
		ps.forcedHyperspaceFail = forcedFail;
		
		if(tunnelGate){
			GameObject.Find("SceneScripts").GetComponent.<TestingScene>().hyperspaceDestination = destinationSector;
		}
	} 
}


function OnTriggerExit (other : Collider) {
	if (other.gameObject == theShip){
		theShip.GetComponent.<ship>().inGate = false;
	    theShip.GetComponent.<ship>().updateJumpStatus();
		
	} 
}
function Update () {
	
	transform.rotation *= Quaternion.Euler(0.01,0,0);
}