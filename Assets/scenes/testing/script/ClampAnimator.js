#pragma strict

var test : boolean = false;
var triggered : boolean = false;
function Start () {

}

function Update () {
	if(test){
		test = false;
		trigger();
	
	}
}

function trigger(){
	if(triggered){ return; };
	triggered = true;
	for(var a : Animation in GetComponentsInChildren.<Animation>()){
		a.Play("open");
	}
}