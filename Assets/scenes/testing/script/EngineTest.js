#pragma strict


var aSource : AudioSource;
var lastVel : float;
var accel : float;
var theShip : Transform;

var pitchCurve : AnimationCurve;
var volumeCurve : AnimationCurve;

function Start () {
	aSource = GetComponent.<AudioSource>();
	theShip = GameObject.Find("TheShip").transform;
	aSource.Play();
	aSource.loop= true;
}

function FixedUpdate(){
	accel = (theShip.rigidbody.velocity.magnitude - lastVel) / Time.fixedDeltaTime;
	lastVel = theShip.rigidbody.velocity.magnitude;
	
	if(accel > 0){
		var a : float = accel > 40 ? 40 : accel;
		
		aSource.pitch = Mathf.Lerp(aSource.pitch, pitchCurve.Evaluate(a / 40), Time.fixedDeltaTime);
		aSource.volume = Mathf.Lerp(aSource.volume, volumeCurve.Evaluate(a / 40), Time.fixedDeltaTime);
	} else {
		aSource.volume = 0;
	}
	
	
}
	

function Update () {

}