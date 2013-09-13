#pragma strict

var toFollow : Transform;
private var offset : Vector3;
function Start () {
	if(toFollow == null){
		toFollow = GameObject.Find("TheShip").transform;
	}
	offset = transform.position - toFollow.position;

}

function FixedUpdate () {
	transform.position = toFollow.position + offset;

}