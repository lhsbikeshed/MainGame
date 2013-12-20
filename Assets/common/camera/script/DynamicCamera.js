#pragma strict

var theShip : Transform;

var currentLocation : Transform;
var lookAtShip : boolean;



function Start () {
	theShip = GameObject.Find("TheShip").transform;
	resetToShip();

}

function setLocation(t : Transform){
	transform.parent = t;
	transform.localPosition = Vector3.zero;
}

function resetToShip(){
	transform.parent = GameObject.Find("DefaultDynamicCamera").transform;
	transform.localPosition = Vector3.zero;
	transform.localRotation = Quaternion.identity;
	transform.LookAt(theShip);
	camera.fov = 60.0;
}

function FixedUpdate () {
	//transform.position = currentLocation.position;
	//transform.rotation = currentLocation.rotation;
	if(lookAtShip){
		transform.LookAt(theShip);
		
	}

}