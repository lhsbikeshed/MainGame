#pragma strict

var waypoints : SequenceWaypoint[];

var targetWaypoint : int = 0;
var objectToMove : Transform;
var intitialPause : float = 5.0f;

var canBeUsed : boolean = false;


private var startPos : Vector3;
private var startRot : Quaternion;

private var running : boolean = false;
private var startTime : float;

var trigger : boolean = false;
var lerp : float = 0.0f;

@script RequireComponent( AudioSource)



function Start () {
	if(objectToMove == null){
		objectToMove = GameObject.Find("TheShip").transform;
	}	
}

function OnTriggerEnter(c : Collider){
	if(c.name == objectToMove.name && canBeUsed == false){
	
		canBeUsed = true;
		var m : OSCMessage = OSCMessage("/scene/launchland/grabberState");
		m.Append.<int>(1);
		OSCHandler.Instance.SendMessageToAll(m);
	}
	
}

function OnTriggerExit(c : Collider){
	if(c.name == objectToMove.name && canBeUsed == true){
	
		canBeUsed = false;
		var m : OSCMessage = OSCMessage("/scene/launchland/grabberState");
		m.Append.<int>(0);
		OSCHandler.Instance.SendMessageToAll(m);
	}
	
}

function begin(){
	if(! running && canBeUsed){
		yield WaitForSeconds (intitialPause);
		audio.clip = waypoints[0].inSound;
		audio.loop = false;
		audio.Play();
		startPos = objectToMove.transform.position;
		startRot = objectToMove.transform.rotation;
		targetWaypoint = 0;
		startTime = Time.fixedTime;
		objectToMove.rigidbody.constraints = RigidbodyConstraints.FreezeAll;
		running = true;
		
	}
}



function FixedUpdate(){
	if(running){
		
	
		var duration : float =  waypoints[targetWaypoint].durationTo;
		var pause : float =  waypoints[targetWaypoint].pause;
		if(Time.fixedTime > startTime + duration){
			if(audio.clip != waypoints[targetWaypoint].outSound){
				audio.loop = false;
				audio.Stop();
				audio.clip = waypoints[targetWaypoint].outSound;
				audio.Play();
			}
			if(Time.fixedTime > startTime + duration + pause){
				if(targetWaypoint + 1 < waypoints.length){
				
					targetWaypoint ++;
					startTime = Time.fixedTime;
					startPos = objectToMove.transform.position;
					startRot = objectToMove.transform.rotation;
					audio.loop = false;
					audio.Stop();
					audio.clip = waypoints[targetWaypoint].inSound;
					audio.Play();
				} else {
					Debug.Log("done");
					
					
					running = false;
				}
			}
		} else {
			if(audio.isPlaying == false){
				audio.clip = waypoints[targetWaypoint].duringSound;
				audio.loop = true;
				audio.Play();
			}
			lerp = (Time.fixedTime - startTime) / duration;
			objectToMove.transform.position = Vector3.Lerp(startPos, waypoints[targetWaypoint].transform.position, lerp);
			objectToMove.transform.rotation = Quaternion.Slerp(startRot, waypoints[targetWaypoint].transform.rotation, lerp);
		}
	}
}

function Update () {
	if(trigger){
		trigger = false;
		begin();
	}
}