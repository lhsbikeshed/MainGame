#pragma strict

var rotationSpeed : float = 0.0f;

var startOn : boolean = false;

private var on : boolean = false;
private var lights : Light[];

function Start () {
	lights = GetComponentsInChildren.<Light>();
	setState(startOn);
}

function FixedUpdate(){
	if(on){
		transform.localRotation *= Quaternion.Euler(rotationSpeed,0,0);
	}
}


function setState( state : boolean){

	on = state;
	if(on){
		for (var l : Light in lights){
			l.color = Color(1,0,0);
		}
	} else {
		for (var l : Light in lights){
			l.color = Color(0,0,0);
		}
	}

}