#pragma strict
var target :  Transform;
var distance : float;



function Start () {
	if(target == null){
		target = GameObject.Find("TheShip").transform;
	}
}

function Update () {
	transform.position = target.transform.position + (target.rigidbody.velocity.normalized * distance);
	
	transform.LookAt(target);
	transform.rotation *= Quaternion.Euler(180,0,0);
	
	
}