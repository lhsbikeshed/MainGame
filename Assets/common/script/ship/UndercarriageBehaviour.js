#pragma strict

var colliders : Transform[];

var state : int = 1;


var howManyInContact : int = -1;	//how many feet are touching the docking bay?

var transitSound : AudioClip;


var forPlayer : boolean = true;

private var contactsThisFrame : boolean[];	//has the collider contacted this frame?
var wheelUpPos : float = 0.1;
var wheelDownPos : float = -0.7;
var speed : float = 0.1f;
private var wheelPosition : float = -0.7;

static var UP : int = 0;
static var DOWN : int = 1;
static var TRANSIT_DOWN : int = 2;
static var TRANSIT_UP : int = 3;




function Start () {
	
	
	
	contactsThisFrame = new boolean[colliders.Length];
	wheelPosition = wheelDownPos;
	
}
//true for collide, false for not
function updateFootColliders(st : boolean){
	for(var g in colliders){
		g.collider.isTrigger = !st;
	}
}

function Update () {
	var g : Transform;
	if(state == TRANSIT_DOWN){
		if(wheelPosition >= wheelDownPos){
			wheelPosition = Mathf.MoveTowards(wheelPosition, wheelDownPos - 0.01, speed * Time.deltaTime);
		} else {
			state = DOWN;
			
			//updateFootColliders(true);
			if(forPlayer){
				var msg : OSCMessage = OSCMessage("/ship/undercarriage");
				msg.Append.<int>(state);
				OSCHandler.Instance.SendMessageToAll(msg);
				var tm : OSCMessage = new OSCMessage("/ship/effect/playSound");
				tm.Append("gearExtended");
				OSCHandler.Instance.SendMessageToClient("PilotStation", tm);
			}
		}
		
	} else if(state == TRANSIT_UP){
		if(wheelPosition <= wheelUpPos){
			wheelPosition = Mathf.MoveTowards(wheelPosition, wheelUpPos + 0.01, speed * Time.deltaTime);
		} else {
			state = UP;
			
			
			//updateFootColliders(false);
			if(forPlayer){
				var msg2 : OSCMessage = OSCMessage("/ship/undercarriage");
				msg2.Append.<int>(state);
				OSCHandler.Instance.SendMessageToAll(msg2);
				var t : OSCMessage = new OSCMessage("/ship/effect/playSound");
				t.Append("gearRetracted");
				OSCHandler.Instance.SendMessageToClient("PilotStation", t);
			}
		}
		
	}
	for(var i : int; i < colliders.Length; i ++){
		g = colliders[i];
		g.localPosition.y = wheelPosition;
			
	}
	
}

function getGearState()  :int{
	return state;
}


//if intransit and up : enable the colliders and move them down to position
//if intransit and down: move up and disable at end of transit
@RPC
function setGearState (newState : boolean){
	var msg : OSCMessage = OSCMessage("/ship/undercarriage");
	
	if(state == DOWN){
		if(newState == false){	//pull em up!
			state = TRANSIT_UP;
			if(transitSound != null){
				AudioSource.PlayClipAtPoint(transitSound, transform.position);
			}
		}
	} else if (state == UP){
		if(newState == true){
			state = TRANSIT_DOWN;
			if(transitSound != null){
				AudioSource.PlayClipAtPoint(transitSound, transform.position);
			}
		}
	}
	msg.Append.<int>(state);
	if(forPlayer){
		OSCHandler.Instance.SendMessageToAll(msg);
//		if(PersistentScene.networkReady == true){
//			networkView.RPC ("setGearState", RPCMode.Others, newState);
//		}
	}
}

function OnCollisionStay(c : Collision){
	var ct : int = 0;
	
	for(var i = 0; i < contactsThisFrame.Length; i++){
		contactsThisFrame[i] = false;
	}
	
	for(var cp : ContactPoint in c.contacts){
		var colCount : int = 0;
		for(var col : Transform in colliders){
			var footCollider : Collider = col.GetComponent.<Collider>();
			if(cp.thisCollider == footCollider && contactsThisFrame[colCount] == false){
				ct ++;
				contactsThisFrame[colCount] = true;
				
			}
			colCount++;
		}
	}
	
	if(howManyInContact != ct){
		if(forPlayer){
			var msg : OSCMessage = OSCMessage("/ship/undercarriage/contact");
			if(ct >= 3){		//number of feet in contact has changed and its now 4, let everyone know clamp can be used
				msg.Append.<int>(1);
				OSCHandler.Instance.SendMessageToAll(msg);
			} else if(howManyInContact >= 3){		//number of feet has changed and it WAS 4, clamp disabled
				msg.Append.<int>(0);
				OSCHandler.Instance.SendMessageToAll(msg);
			}
		}
	}
	
	
	howManyInContact = ct;
	
}

