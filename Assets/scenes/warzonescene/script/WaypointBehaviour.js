#pragma strict

private var wpController : WaypointController;

function Start () {
	wpController = GameObject.Find("SceneScripts").GetComponent.<WaypointController>();
}

function Update () {

}

function OnTriggerEnter(col : Collider){
	if(col.name == "TheShip"){
		wpController.gateDone(gameObject);
	}
}