#pragma strict

var cooldownTime : float; //how long to cool back to 0

@HideInInspector
var material : GUITexture;
var alpha : float = 0.0f;
var startTime : float;
var exploding : boolean = false;

var heartBeatEnabled : boolean = false;
private var inBeat : boolean = false;
private var lastHeartBeat : float = 0;
var heartBeatSfx : AudioClip;
var heartRate : float;

var explosionObject : GameObject;
var explosionPrefab : GameObject;

private var theShip : Transform;


private var MODE_OFF : int = 0;
private var MODE_EXPLODE: int = 1;
private var MODE_DIE : int = 2;


private var mode : int = MODE_OFF;

function Start () {
	setupObject();

	
	theShip = GameObject.Find("TheShip").transform;
}

function OnLevelWasLoaded (level : int) {
	setupObject();
}

function setupObject(){
	explosionObject = GameObject.Find("ExplosionOverlay");
	
	if(explosionObject == null){
		//create it
		explosionObject = Instantiate(explosionPrefab, Vector3(0.5,0.5,0), Quaternion.identity);	
	}
	material = explosionObject.GetComponent.<GUITexture>();
	material.color.a = 0;
}

function die(){
	alpha = 0.0f;
	startTime = Time.fixedTime;
	mode = MODE_DIE;
	cooldownTime = 2.0f;
}
function explode(){
	alpha = 1.0f;
	startTime = Time.fixedTime;
	exploding = true;
	mode = MODE_EXPLODE;
}

function setHeartRate(rate : float){
	if(rate <= 0.0){
		heartBeatEnabled = false;
		material.color = Color(0,0,0,0.0);			

	} else {
		heartBeatEnabled = true;
		
		heartRate = rate;
		
	}
}

function Update () {
	if(!heartBeatEnabled){
		if(mode == MODE_EXPLODE){
			material.color = Color(255,255,255,alpha);
			alpha = Mathf.Lerp(1.0f, 0.0f, (Time.fixedTime - startTime) / cooldownTime);
			if(alpha <= 0.0f){
				alpha = 0.0f;
				exploding = false;
				mode = MODE_OFF;
				
			}
		} else if (mode == MODE_DIE){
			material.color = Color(255,255,255,alpha);
			alpha = Mathf.Lerp(0.0f, 1.0f, (Time.fixedTime - startTime) / cooldownTime);
			if(alpha >= 1.0f){
				alpha = 1.0f;
				
				
			}
		}
	}
	
	
	if(heartBeatEnabled){
		if(lastHeartBeat + (1.0 / heartRate) < Time.fixedTime){
			
			lastHeartBeat = Time.fixedTime;
			if(inBeat == false){	//just play the sound once
				AudioSource.PlayClipAtPoint(heartBeatSfx, theShip.transform.position);
				var msg : OSCMessage = OSCMessage("/ship/effect/heartbeat");
				OSCHandler.Instance.SendMessageToAll(msg);

			}
			inBeat = true;
		} else {
			inBeat = false;
			alpha = map(Time.fixedTime - lastHeartBeat, 0, 1.0/heartRate/2, 1.0, 0.0);
			alpha = Mathf.Clamp(alpha,0.0, 1.0);
			material.color = Color(0,0,0,alpha);			
		}
		
		if(inBeat){
			
		}
	}
	
	

		
}


function map(x : float, in_min : float, in_max : float, out_min : float, out_max : float) : float
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}