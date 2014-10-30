#pragma strict

//var destinationScene : int;
var jumpNodeFrequency : int;
var forcedFail : boolean; //do we force a failure on this jump?


var gateEnabled : boolean = true;


var test : boolean = false;



private var theShip : GameObject;
private var oscSender : OSCSystem;



function Start () {
	theShip = GameObject.Find("TheShip");
	oscSender = GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>();
}


function OnTriggerEnter (other : Collider) {
	if(gateEnabled){
		if (other.gameObject == theShip){
			theShip.GetComponent.<JumpSystem>().inGate = true;
			
			theShip.GetComponent.<JumpSystem>().updateJumpStatus();
			
			var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			
			ps.forcedHyperspaceFail = forcedFail;
			
			
			
		} 
	}
}

function explode(){
	//stop rotation
	var rr : RingRotationBehaviour[] = GetComponentsInChildren.<RingRotationBehaviour>();
	for (var p in rr){
		p.speed = 0;
	}
	
	var bf : BlinkenFlareBehaviour[] = GetComponentsInChildren.<BlinkenFlareBehaviour>();
	for (var b in bf){
		b.blinking = false;
		b.flickerAndDie();
	}
	
	//disable collider
	var c : Collider = GetComponentInChildren.<Collider>();
	c.enabled = false;
	
	var part : ParticleSystem = GetComponentInChildren.<ParticleSystem>();
	part.enableEmission = false;
	
	
	
	for(var t : Transform in GetComponentsInChildren.<Transform>()){
		Debug.Log(t.name);
		if(t.name.Contains("Plane")){
			t.parent = null;
			t.gameObject.AddComponent.<Rigidbody>();
			t.rigidbody.useGravity = false;
			t.rigidbody.AddForce( (transform.position - t.position).normalized * -10, ForceMode.Impulse);
			t.rigidbody.AddTorque(Vector3(0,40,0), ForceMode.Impulse);
			
			
		}
	}
	
	
	
}
	


function OnTriggerExit (other : Collider) {
	
	if (other.gameObject == theShip){
		theShip.GetComponent.<JumpSystem>().inGate = false;
	    theShip.GetComponent.<JumpSystem>().updateJumpStatus();
		
	} 
}
function Update () {
	if(test){
		test = false;
		explode();
	}
	//transform.rotation *= Quaternion.Euler(0.01,0,0);
}