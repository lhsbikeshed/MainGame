#pragma strict

var theShip : GameObject;
var objectList : List.<TargettableObject>;
var targettedObject : Transform;

private var grapplingHook : GrapplingHook;



private var separator : char[] = ["/"[0]];


function Start () {
	theShip = GameObject.Find("TheShip");
	grapplingHook  = GetComponentInChildren.<GrapplingHook>();
	
}

function Update () {

}

function OnLevelWasLoaded (level : int) {
	objectList.Clear();
}

function addObject(g: GameObject){
	var t : TargettableObject = g.GetComponent.<TargettableObject>();
	if(t!=null){
		addObject(t);
	}
}

function addObject(g : TargettableObject ){
	if(!objectList.Contains(g)){
		objectList.Add(g);
	}
}

function clearHighlights(){

	for(var o in objectList){
		o.highlighted = false;
	}
}

function processOSCMessage(message : OSCMessage){
	var msgAddress = message.Address.Split(separator);
	var target = msgAddress.length >= 3 ? msgAddress[3] : 0;
	switch(target){
		case "targetObject":		//target a missile given by hashcode in (0)
			var tgt : int =  message.Data[0];
			Debug.Log("attempting to target.. " + tgt);
			for(var m in objectList){
				if(m!=null){
					if(m.targetId == tgt && m.targettable){
						m.targetted = true;
						targettedObject = m.transform;
						Debug.Log("Target ok: " + tgt);
					} else {
						m.targetted = false;
						
					}
				}
			}
			break;
			
			
		case "untargetObject":		//target a missile given by hashcode in (0)
			var tg : int =  message.Data[0];
			for(var m in objectList){
				
				if(m != null && m.targetId == tg){
					m.targetted = false;
					targettedObject = null;
				} 
			}
			break;
		case "fireGrappling":
			if(targettedObject != null && targettedObject.GetComponent.<TargettableObject>().grappleable == true){
				if((theShip.transform.position - targettedObject.position).magnitude  < 100){
					grapplingHook.setTarget(targettedObject);
					
					grapplingHook.Fire();
				} else {
					OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "Target out of range, must be < 100m away", 2000);
				}
			} else {
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "No Target Selected", 1000);
			}
			break;
			
		case "releaseGrappling":
			grapplingHook.Release();
			break;
			
		case "fireAtTarget":	//fire at targetted object
			var msg : OSCMessage ;
			
			
			if(targettedObject != null ){
				var tscript : TargettableObject = targettedObject.GetComponent.<TargettableObject>();
				if(tscript.exploding == false){
					var targetRange : float = (theShip.transform.position - targettedObject.position).magnitude;
					var wp : int = theShip.GetComponent.<ship>().weaponsPower;
					var maxBeamRange : float = 1000 + wp * 300;
					if(targetRange > maxBeamRange){
						msg = new OSCMessage("/tactical/weapons/targetRange");
						msg.Append.<int>(tscript.targetId);
						OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
						OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ERROR", "Target Out Of Range, current range: " + targetRange, 1000);
					} else {
						msg = new OSCMessage("/tactical/weapons/firingAtTarget");
						msg.Append.<int>(tscript.targetId);
						OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
						
						theShip.GetComponent.<ship>().laserTurret.fireAtTarget(targettedObject);
						
						
						var damage : float = (1.0 - (targetRange / maxBeamRange)) * (  wp  / 3.0f) * tscript.baseDamage;
						
						
						tscript.GetShot(damage);
					}
				}
				
				
			} else {
				msg = new OSCMessage("/tactical/weapons/noTarget");
				Debug.Log("no target for firing");
				OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "No Target Selected", 1000);
			}
		
			break;
		}
	}


function sendOSCUpdates(){
	var msg : OSCMessage; // = new OSCMessage("/tactical/targetupdate");
	
	for(var i = objectList.Count - 1; i >= 0; i--){
		
		
		if(objectList[i] == null){
			//msg = new OSCMessage("/tactical/weapons/targetRemove");
			//msg.Append.<int>(missScript.targetId);
			//OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
			objectList.RemoveAt(i);
		} else if(objectList[i].gameObject.active == true){
			var t:Transform = objectList[i].transform;
			var pos : Vector3 = t.position - theShip.transform.position;
			var missScript : TargettableObject = t.GetComponent.<TargettableObject>();
			if(missScript.visibleAtClient == true && missScript.exploding == false){
				
		
				msg = new OSCMessage("/tactical/weapons/targetUpdate");
				msg.Append.<int>(missScript.targetId);
				msg.Append.<int>(missScript.scanCode);
				msg.Append.<int>(missScript.trackingPlayer == true ? 1 : 0);
				msg.Append.<int>(missScript.targetted == true ? 1 : 0);
				msg.Append.<float>(pos.x);
				msg.Append.<float>(pos.y);
				msg.Append.<float>(pos.z);
				msg.Append.<float>(missScript.statValues[0]);
				msg.Append.<float>(missScript.statValues[1]);
				msg.Append.<String>(missScript.statNames[0]);
				msg.Append.<String>(missScript.statNames[1]);
				msg.Append.<String>(missScript.objectName);
				OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
					

			
				var diffVector : Vector3 = objectList[i].transform.position - theShip.transform.position;
				diffVector = Quaternion.Inverse(theShip.transform.rotation) * diffVector;
				diffVector *= 0.2f;		
				
				if(diffVector.magnitude < 50000 && missScript.enabled){
					msg  = OSCMessage("/radar/update");		
					msg.Append.<int>( missScript.targetId );
					msg.Append.<String>(missScript.objectName);		
					msg.Append.<float>(diffVector.x);
					msg.Append.<float>(diffVector.y);
					msg.Append.<float>(diffVector.z);
					var col : String = "" + missScript.colour.r + ":" + missScript.colour.g + ":" + missScript.colour.b;
					msg.Append.<String>(col);
					msg.Append.<String>(missScript.stateText);	
					msg.Append.<int>(missScript.highlighted == true ? 1 : 0);
					//TODO
					// add a confidence value here and use it to jitter the radar results around. This relates to amount of power going to sensors
					//OSCHandler.Instance.SendMessageToAll( msg);
					OSCHandler.Instance.SendMessageToClient("PilotStation", msg);

				}
				
			
				
			}
		}
			
	}
	
	
		
}

/* update the radar tracking lists */
function updateTrackingList(){
	var list : Transform[] = FindObjectsOfType(Transform);
	objectList = new List.<TargettableObject>(0);

	
	
	for (var go : Transform in list){
		//if(go.parent == null){
			var rItem : TargettableObject = go.GetComponent.<TargettableObject>();
			
			if(rItem != null){
				
				objectList.Add(rItem);
			}			
		//}
	}
	Debug.Log(objectList.Count + "radar items");
	
			
}

