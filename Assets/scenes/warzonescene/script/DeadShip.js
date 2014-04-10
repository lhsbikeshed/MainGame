#pragma strict

private var randomRotation : Vector3;

var hidden : boolean = true;

var test : boolean = false;


function Start () {
	randomRotation = Random.onUnitSphere * 0.03f;
	if(hidden){
		hidden = false;
		hide();
	} else {
		hidden = true;
		show();
	}
}

function FixedUpdate () {
	rigidbody.AddTorque(randomRotation, ForceMode.Force);
	
	if(test){
		test = false;
		if(hidden){
			show();
		} else {
			hide();
		}
	}
}

function hide(){
	if(!hidden){
		transform.position = Vector3(-15000, -15000, -16000);
		//GetComponent.<GeneralTrackableTarget>().enabled = false;
		hidden = true;
	}
}

function show(){
	if(hidden){
		transform.position = Random.onUnitSphere * Random.Range(200,500);
		//GetComponent.<GeneralTrackableTarget>().enabled = true;
		hidden = false;
		
	}
}