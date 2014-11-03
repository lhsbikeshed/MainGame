#pragma strict

var theShip : Transform;
var scaleFactor : float;
private var startRot  :Quaternion;

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	startRot = transform.localRotation;
}

function FixedUpdate () {
 	var vel : Vector3 = theShip.rigidbody.velocity;
 	
	var q : Quaternion = Quaternion.Euler(vel.y * scaleFactor, -vel.x * scaleFactor,0);
	transform.localRotation = Quaternion.RotateTowards(transform.localRotation, startRot * q,10f);
	
}