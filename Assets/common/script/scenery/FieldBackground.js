#pragma strict
var target : Transform;
var rotation : Vector3;
private var rot : Quaternion;

function Start () {
	rot = Quaternion.Euler(rotation.x, rotation.y, rotation.z);
}

function Update () {
	transform.position = target.position;
	transform.rotation *= rot;
}