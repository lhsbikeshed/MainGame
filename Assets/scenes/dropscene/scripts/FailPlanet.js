#pragma strict


var moveSpeed : float = 10;
private var running : boolean = false;



function Start () {

}

function Update () {


	if(running){
		transform.position.z += moveSpeed * Time.deltaTime;
	}
}

function startScene(){
	running = true;
}