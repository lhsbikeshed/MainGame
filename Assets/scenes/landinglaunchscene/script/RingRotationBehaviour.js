#pragma strict

var speed : float = 1.0f;

private var rot : Quaternion;
function Start () {
	rot = transform.rotation;
}

function Update () {

}

function FixedUpdate(){
	rot = Quaternion.Euler(speed, 0, 0);
	transform.rotation *= rot;
}
