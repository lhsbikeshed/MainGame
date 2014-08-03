#pragma strict

var tgt: Transform;
private var ship : ship;
private var basePos : Vector3;

function Start () {
	ship = tgt.GetComponent.<ship>();
	basePos = transform.position;
}

function Update () {
	transform.LookAt(tgt);

	transform.position.z = basePos.z;
}