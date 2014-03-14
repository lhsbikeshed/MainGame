#pragma strict

//for the crane grabber
var translate : boolean  =false;
var rotate : boolean = false;
var durationTo : float = 1.0f;
var pause : float = 1.0f;

//for general flight
var newVelocity : float = 0;
var hyperOut : boolean = false;
var visited : boolean = false;
var sensorDistance : float = 0.0f;
var matchRotation : Transform;

var inSound : AudioClip;
var outSound : AudioClip;
var duringSound : AudioClip;

var OnArrive : Function;

function Start () {

}

function Update () {
	if(matchRotation != null){
		transform.rotation = matchRotation.rotation;
	}

}

//function OnArrive(gObj : GameObject){
//}

function OnDrawGizmos(){
	Gizmos.color = Color.red;
	Gizmos.DrawWireSphere (transform.position, sensorDistance);
}