#pragma strict

var target : Transform;
var inUse : boolean = false;

private var reelDirection : int  = 0;
var maxLength : float;
var length : float = 0.0f;
var strain : float = 0.0f;
var maxStrain : float = 25.0f;

var fireSound : AudioClip;
var breakSound : AudioClip;

var lockState : boolean = false;

private var lineRenderer : LineRenderer;
private var tgtPoint : Vector3;
private var fireTime : float;
private var fireSpeed : float = 25.0f;

private var theShip : GameObject;
private var sp : SpringJoint;

private var lastOscTime = 0.0f;

function Start () {
	lineRenderer = GetComponent.<LineRenderer>();
	lineRenderer.enabled = false;
	
	theShip = GameObject.Find("TheShip");
	
	
}

function Update () {
	if(inUse){
		lineRenderer.SetPosition(0, transform.position);
		lineRenderer.SetPosition(1, tgtPoint);
		if(reelDirection == 1){
			tgtPoint += (target.position - transform.position) / fireSpeed;
			if(Vector3.Distance(tgtPoint, target.position) < 10){
				reelDirection = 0;
				inUse = true;
				tgtPoint = target.position;
			}
		} else if (reelDirection == -1){
			tgtPoint += (transform.position - target.position) / fireSpeed;
			if(Vector3.Distance(tgtPoint, transform.position) < 10){
				reelDirection = 0;
				inUse = false;
				tgtPoint = transform.position;
				lineRenderer.enabled = false;
			}
		} else {
			tgtPoint = target.position;
		}
	}
}

function FixedUpdate(){
	if(inUse){
		length = (target.position -transform.position).magnitude;
		if(Vector3.Distance(target.position, transform.position) > maxLength){
			var force : Vector3 =  transform.position - target.position;
			
			var mod : float = force.magnitude - maxLength;
			target.rigidbody.AddForce(force * mod, ForceMode.Force);
			strain = mod - strain;
			if(strain < 0){ strain = 0; }
			
			if(strain > maxStrain){
				Snap();
			}
			
		}
		if(lastOscTime + 0.25f < Time.fixedTime){
			lastOscTime = Time.fixedTime;
			SendOSCMessages();
		}
	} else {
		strain = 0.0f;
	}
}

function SendOSCMessages(){
	var msg : OSCMessage = new OSCMessage("/clientscreen/TacticalStation/towState");
	
	msg.Append.<float>(length);
	msg.Append.<float>(strain);
	OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
}

function Snap(){
	AudioSource.PlayClipAtPoint(breakSound, transform.position);
	OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "WARNING", "Tether snapped, please re-grapple", 2000);
	inUse = false;
	lineRenderer.enabled = false;
	var rg : TargettableObject = target.GetComponent.<TargettableObject>();
	if(rg != null){
		rg.releaseGrapple();
		
		
	}
	//lineRenderer.enabled = false;
	reelDirection = 0;
	
	OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");
}


function setTarget(t : Transform){
	if(inUse == false){
		target = t;
	}
}

function Fire(){
	if(lockState) { return; }
	if(inUse == false){
		reelDirection = 1;
		tgtPoint = transform.position;
		AudioSource.PlayClipAtPoint(fireSound, transform.position);
		inUse = true;
		lineRenderer.enabled = true;
		lineRenderer.SetPosition(0, transform.position);
		lineRenderer.SetPosition(1, tgtPoint);
		length = 100;
		//let the target know it got grappled
		var rg : TargettableObject = target.GetComponent.<TargettableObject>();
		if(rg != null){
			rg.gotGrappled();
			
			
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Success", "Grappling hook attached to target", 2000);
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "towing");

			
		}
	}
}

function Release(){
	if(lockState) { return; }
	if(inUse == true){
		var rg : TargettableObject = target.GetComponent.<TargettableObject>();
		if(rg != null){
			rg.releaseGrapple();
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Success", "Grappling hook released", 2000);
			
		}
		//lineRenderer.enabled = false;
		reelDirection = -1;
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");

		
	}
}