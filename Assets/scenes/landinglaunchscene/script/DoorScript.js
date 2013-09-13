#pragma strict

 var OPENING : int = 1;
 var CLOSING : int = 2;
 var OPEN : int = 3;
 var CLOSED : int = 4;

 var state : int;

var openDistance : float;
var duration : float;
var localDirection : Vector3 = Vector3(0,1,0);
var airlockEffect : boolean = true;
var shutterClip : AudioClip;
private var changeTime: float;
private var effectObject: AirlockEffectBehaviour;
private var localStartPosition : Vector3;
var test : boolean = false;

function Start () {
	state = CLOSED;
	if(airlockEffect){
		effectObject = GameObject.Find("AirlockEffects").GetComponent.<AirlockEffectBehaviour>();
	}
	//effectObject.stop();
	localStartPosition = transform.localPosition;
}

function Update () {


}

function FixedUpdate(){
if(test){
test = false;
openDoor();
}

	var amount : float = (Time.fixedTime - changeTime) / duration;
	if(state == OPENING){
		//transform.localPosition.y = Mathf.Lerp(0,openDistance, amount);
		transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(0,openDistance, amount));
		if(airlockEffect){
			effectObject.setAtmosphereLevel(1 - amount);
		}
	} else if (state == CLOSING){
		//transform.localPosition.y = Mathf.Lerp(openDistance,0, amount);
		transform.localPosition = localStartPosition + ((transform.localRotation * localDirection) * Mathf.Lerp(openDistance,0, amount));
	}
	if(amount >= 1.0){
		amount = 1.0;
		if (state == OPENING){
			state = OPEN;
			if(airlockEffect){ effectObject.stop(); }
		} else if (state == CLOSING){
			state = CLOSED;
			
		}
	}
	
}

function toggleDoor(){
	if(state == OPEN){
		closeDoor();
	}else if (state == CLOSED){
		openDoor();
	}
}

function openDoor(){
	if(state == CLOSED){
		state = OPENING;
		changeTime = Time.fixedTime;
		if(airlockEffect){ effectObject.start(); }
		if(shutterClip != null){
			AudioSource.PlayClipAtPoint(shutterClip, transform.position);
		}
	}
}

function closeDoor(){
	if(state == OPEN){
		state = CLOSING;
		changeTime = Time.fixedTime;
		if(shutterClip != null){
			AudioSource.PlayClipAtPoint(shutterClip, transform.position);
		}
	}
}