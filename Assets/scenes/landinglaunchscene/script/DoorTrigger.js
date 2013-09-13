#pragma strict
var dockChamber : DockChamberScript;


function Start () {

}

function OnTriggerExit(collider : Collider){

	dockChamber.closeDoor();
	GameObject.Find("AmbientLight").GetComponent.<Light>().enabled = true;
	
	
}

function Update () {

}