#pragma strict

private var theShip : GameObject; //the ship
 
 
function Start () {

	//get our refs
	theShip = GameObject.Find("TheShip");



	//this is a large skybox map, set the ships camera to reflect this
	theShip.Find("camera").GetComponent.<Camera>().clearFlags = CameraClearFlags.Depth;

}

function Update () {

}