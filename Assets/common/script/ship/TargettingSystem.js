#pragma strict

var theShip : GameObject;
var objectList : List.<TargettableObject>;
var targettedObject : Transform;
var hookArmed : boolean = false;
var flarePrefab : Transform;

public static var instance : TargettingSystem;


private var separator : char[] = ["/"[0]];

/* weapon hardpoint deployment state */
enum WeaponState  { WEAPON_STOWED = 0, WEAPON_DEPLOYED = 1, WEAPON_TRANSIT_OUT = 2, WEAPON_TRANSIT_IN = 3};


public var weaponTransitOutNoise : AudioClip;
public var weaponTransitInNoise : AudioClip;
private var weaponTransitNoises : AudioSource;
public var  weaponState : WeaponState = WeaponState.WEAPON_STOWED;
private var targetWeaponState : WeaponState = WeaponState.WEAPON_STOWED; 
private var weaponStateChangeTimer = 0.0f;


function Start () {
	theShip = GameObject.Find("TheShip");
	instance = this;
	weaponTransitNoises = gameObject.AddComponent.<AudioSource>();
	
}

function FixedUpdate () {
	if(weaponState == weaponState.WEAPON_TRANSIT_IN || weaponState == weaponState.WEAPON_TRANSIT_OUT){
		weaponStateChangeTimer -= Time.fixedDeltaTime;
		if(weaponStateChangeTimer <= 0.0f){
			weaponState = targetWeaponState;
			
			//play a sound and tell clients
			
			var m : OSCMessage = OSCMessage("/ship/weaponState");
			var s : int = weaponState;
			m.Append(s);
			OSCHandler.Instance.SendMessageToAll(m);
		}
	}

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

/* ----- WEAPON CONTROL */

function changeWeaponState(newState : int){
	if(newState != weaponState){
		Debug.Log("changing weapon state to : " + newState);
		targetWeaponState = newState;
		if(weaponState == WeaponState.WEAPON_DEPLOYED){
		
			weaponState = WeaponState.WEAPON_TRANSIT_IN;
		} else if (weaponState == WeaponState.WEAPON_STOWED){
			weaponState = weaponState.WEAPON_TRANSIT_OUT;
		}
		//tell clients the weapons are moving
		var m : OSCMessage = OSCMessage("/ship/weaponState");
		var s : int = weaponState;
		m.Append(s);
		OSCHandler.Instance.SendMessageToAll(m);
		
		//play a sound as well
		weaponTransitNoises.Stop();
		if(newState == weaponState.WEAPON_DEPLOYED && weaponTransitOutNoise != null){
			weaponTransitNoises.clip = weaponTransitOutNoise;
			weaponTransitNoises.Play();
		} else if (newState == weaponState.WEAPON_STOWED && weaponTransitInNoise != null){
			weaponTransitNoises.clip = weaponTransitInNoise;
			weaponTransitNoises.Play();
		}
			
		//start the timer
		weaponStateChangeTimer = 4.5f;
		
	}
}

function fireWeapons(){
	var msg : OSCMessage;

	if(weaponState == weaponState.WEAPON_DEPLOYED){
		theShip.GetComponent.<ShipCore>().laserTurret.fireAtTarget(targettedObject);
		msg = OSCMessage("/system/targetting/weaponFireOk");

	} else {
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Error", "Weapons not deployed", 2000);
		msg = OSCMessage("/system/targetting/weaponFireFail");

	}
	OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);

		
}

function fireSmartBomb(){
	var msg : OSCMessage;

	if(weaponState == weaponState.WEAPON_DEPLOYED){
		var flar = Instantiate(flarePrefab, theShip.transform.position, theShip.transform.rotation);
		msg = OSCMessage("/system/targetting/smartBombOk");
		
	} else {
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Error", "Weapons not deployed", 2000);
		msg = OSCMessage("/system/targetting/smartBombFail");

	}
	OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
}

/* osc receiver */

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
						m.onTarget();
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
					m.onUnTarget();
					targettedObject = null;
				} 
			}
			break;
		
			
		case "fireAtTarget":	//fire at targetted object
			
			fireWeapons();
			break;
			
		case "fireFlare":
			fireSmartBomb();
			break;
		case "changeWeaponState":
			
			changeWeaponState ( message.Data[0] == 0 ? weaponState.WEAPON_STOWED : weaponState.WEAPON_DEPLOYED);
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
			var uniObj = t.GetComponent.<UniverseObject>();
			var dontSend = false;
			if(uniObj != null && uniObj.inDetailSpace == false){
				dontSend = true;
			}
			
			if(missScript.visibleAtClient == true && missScript.exploding == false && dontSend == false){
				var statString : String = "";
				for(var statId = 0; statId < missScript.statNames.length; statId++){
					statString += missScript.statNames[statId] + ":" + missScript.statValues[statId] + ",";
						
				}	
				if(missScript.visibleAtTactical){
					msg = new OSCMessage("/tactical/weapons/targetUpdate");
					msg.Append.<int>(missScript.targetId);
					msg.Append.<int>(missScript.scanCode);
					msg.Append.<int>(missScript.trackingPlayer == true ? 1 : 0);
					msg.Append.<int>(missScript.targetted == true ? 1 : 0);
					msg.Append.<float>(pos.x);
					msg.Append.<float>(pos.y);
					msg.Append.<float>(pos.z);
					msg.Append.<float>(missScript.statValues[0]);				
					msg.Append.<String>(missScript.statNames[0]);				
					msg.Append.<String>(missScript.objectName);
					
					
					msg.Append.<String>(statString);
					
					OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
				}
				if(missScript.visibleAtPilot){
					

			
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
						msg.Append.<String>(statString);
						//TODO
						// add a confidence value here and use it to jitter the radar results around. This relates to amount of power going to sensors
						//OSCHandler.Instance.SendMessageToAll( msg);
						OSCHandler.Instance.SendMessageToClient("PilotStation", msg);

					}
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

