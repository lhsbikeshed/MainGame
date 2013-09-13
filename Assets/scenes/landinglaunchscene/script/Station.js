#pragma strict
var rotation : Vector3;
private var rot : Quaternion;

var rotating : boolean = false;

function Start () {
	rot = transform.rotation;

}

function Update () {
	
}

function FixedUpdate(){
	if(rotating){
		rot = Quaternion.Euler(rotation.x, rotation.y, rotation.z);
		transform.rotation *= rot;
	}
}