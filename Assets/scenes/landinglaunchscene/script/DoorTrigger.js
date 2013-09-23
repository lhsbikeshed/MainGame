#pragma strict
var dockChamber : DockChamberScript;


function Start () {

}

function OnTriggerExit(collider : Collider){
	if(collider.name == "TheShip"){
		dockChamber.closeDoor();
		GameObject.Find("AmbientLight").GetComponent.<Light>().enabled = true;
	}
	
}

function Update () {

}