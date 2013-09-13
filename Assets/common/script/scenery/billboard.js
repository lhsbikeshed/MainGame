#pragma strict
 var target : Transform;

function Start () {
	if(target == null){
		target = GameObject.Find("TheShip").transform;
	}
}

function Update () {
	transform.LookAt(target);
}