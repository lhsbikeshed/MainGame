using UnityEngine;
using System;
using UnityOSC;
using System.Collections.Generic;

/* weapon hardpoint deployment state */
public enum WeaponState  { WEAPON_STOWED = 0, WEAPON_DEPLOYED = 1, WEAPON_TRANSIT_OUT = 2, WEAPON_TRANSIT_IN = 3};

public class TargettingSystem:MonoBehaviour{
	
	public GameObject theShip;
	public List<TargettableObject> objectList;
	public Transform targettedObject;
	public bool hookArmed = false;
	public Transform flarePrefab;
	
	public static TargettingSystem instance;
	
	
	char[] separator = new char[]{'/'};

	public AudioClip weaponTransitOutNoise;
	public AudioClip weaponTransitInNoise;
	AudioSource weaponTransitNoises;
	public WeaponState weaponState = WeaponState.WEAPON_STOWED;
	WeaponState targetWeaponState = WeaponState.WEAPON_STOWED; 
	float weaponStateChangeTimer = 0.0f;
	
	
	public void Start() {
		theShip = GameObject.Find("TheShip");
		instance = this;
		weaponTransitNoises = gameObject.AddComponent<AudioSource>();
		
	}
	
	public void FixedUpdate() {
		if(weaponState == WeaponState.WEAPON_TRANSIT_IN || weaponState == WeaponState.WEAPON_TRANSIT_OUT){
			weaponStateChangeTimer -= Time.fixedDeltaTime;
			if(weaponStateChangeTimer <= 0.0f){
				weaponState = targetWeaponState;
				
				//play a sound and tell clients
				
				OSCMessage m = new OSCMessage("/ship/weaponState");
				int s = (int)weaponState;
				m.Append(s);
				OSCHandler.Instance.SendMessageToAll(m);
			}
		}
	
	}
	
	public void OnLevelWasLoaded(int level) {
		objectList.Clear();
	}
	
	public void addObject(GameObject g){
		TargettableObject t = g.GetComponent<TargettableObject>();
		if(t!=null){
			addObject(t);
		}
	}
	
	public void addObject(TargettableObject g){
		if(!objectList.Contains(g)){
			objectList.Add(g);
		}
	}
	
	public void clearHighlights(){
	
		foreach(TargettableObject o in objectList){
			o.highlighted = false;
		}
	}
	
	/* ----- WEAPON CONTROL */
	
	public void changeWeaponState(int newState){
		if(newState != (int)weaponState){
			UnityEngine.Debug.Log("changing weapon state to : " + newState);
			targetWeaponState = (WeaponState)newState;
			if(weaponState == WeaponState.WEAPON_DEPLOYED){
			
				weaponState = WeaponState.WEAPON_TRANSIT_IN;
			} else if (weaponState == WeaponState.WEAPON_STOWED){
				weaponState = WeaponState.WEAPON_TRANSIT_OUT;
			}
			//tell clients the weapons are moving
			OSCMessage m = new OSCMessage("/ship/weaponState");
			int s = (int)weaponState;
			m.Append(s);
			OSCHandler.Instance.SendMessageToAll(m);
			
			//play a sound as well
			weaponTransitNoises.Stop();
			if(newState == (int)WeaponState.WEAPON_DEPLOYED && weaponTransitOutNoise != null){
				weaponTransitNoises.clip = weaponTransitOutNoise;
				weaponTransitNoises.Play();
			} else if (newState == (int)WeaponState.WEAPON_STOWED && weaponTransitInNoise != null){
				weaponTransitNoises.clip = weaponTransitInNoise;
				weaponTransitNoises.Play();
			}
				
			//start the timer
			weaponStateChangeTimer = 4.5f;
			
		}
	}
	
	public void fireWeapons(){
		OSCMessage msg = null;
	
		if(weaponState == WeaponState.WEAPON_DEPLOYED){
			theShip.GetComponent<ShipCore>().laserTurret.fireAtTarget(targettedObject);
			msg = new OSCMessage("/system/targetting/weaponFireOk");
	
		} else {
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Error", "Weapons not deployed", 2000);
			msg = new OSCMessage("/system/targetting/weaponFireFail");
	
		}
		OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
	
			
	}
	
	public void fireSmartBomb(){
		OSCMessage msg = null;
	
		if(weaponState == WeaponState.WEAPON_DEPLOYED){
			UnityEngine.Transform flar = (UnityEngine.Transform)Instantiate(flarePrefab, theShip.transform.position, theShip.transform.rotation);
			msg = new OSCMessage("/system/targetting/smartBombOk");
			
		} else {
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Error", "Weapons not deployed", 2000);
			msg = new OSCMessage("/system/targetting/smartBombFail");
	
		}
		OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
	}
	
	/* osc receiver */
	
	public void processOSCMessage(OSCMessage message){
		string[] msgAddress = message.Address.Split(separator);
		string target = msgAddress.Length >= 3 ? msgAddress[3] : "" + 0;
		switch(target){
			case "targetObject":		//target a missile given by hashcode in (0)
				int tgt =  (int)message.Data[0];
				UnityEngine.Debug.Log("attempting to target.. " + tgt);
				foreach(TargettableObject m in objectList){
					if(m!=null){
						if(m.targetId == tgt && m.targettable){
							m.targetted = true;
							targettedObject = m.transform;
							m.onTarget();
							UnityEngine.Debug.Log("Target ok: " + tgt);
						} else {
							m.targetted = false;
							
						}
					}
				}
				break;
				
				
			case "untargetObject":		//target a missile given by hashcode in (0)
				int tg =  (int)message.Data[0];
				foreach(TargettableObject m in objectList){
					
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
				
				changeWeaponState ( (int)((int)message.Data[0] == 0 ? WeaponState.WEAPON_STOWED : WeaponState.WEAPON_DEPLOYED));
				break;
			}
			
		}
	
	
	public void sendOSCUpdates(){
		OSCMessage msg = null; // = new OSCMessage("/tactical/targetupdate");
		
		for(int i = objectList.Count - 1; i >= 0; i--){
			
			
			if(objectList[i] == null){
				//msg = new OSCMessage("/tactical/weapons/targetRemove");
				//msg.Append.<int>(missScript.targetId);
				//OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
				objectList.RemoveAt(i);
			} else if(objectList[i].gameObject.active == true){
				Transform t = objectList[i].transform;
				Vector3 pos = t.position - theShip.transform.position;
				TargettableObject missScript = t.GetComponent<TargettableObject>();
				UniverseObject uniObj = t.GetComponent<UniverseObject>();
				bool dontSend = false;
				if(uniObj != null && uniObj.inDetailSpace == false){
					dontSend = true;
				}
				
				if(missScript.visibleAtClient == true && missScript.exploding == false && dontSend == false){
					string statString = "";
					for(int statId = 0; statId < missScript.statNames.Length; statId++){
						statString += missScript.statNames[statId] + ":" + missScript.statValues[statId] + ",";
							
					}	
					if(missScript.visibleAtTactical){
						msg = new OSCMessage("/tactical/weapons/targetUpdate");
						msg.Append<int>(missScript.targetId);
						msg.Append<int>(missScript.scanCode);
						msg.Append<int>(missScript.trackingPlayer == true ? 1 : 0);
						msg.Append<int>(missScript.targetted == true ? 1 : 0);
						msg.Append<float>(pos.x);
						msg.Append<float>(pos.y);
						msg.Append<float>(pos.z);
						msg.Append<float>(missScript.statValues[0]);				
						msg.Append<String>(missScript.statNames[0]);				
						msg.Append<String>(missScript.objectName);
						
						
						msg.Append<String>(statString);
						msg.Append<int> (missScript.doNotInterpolate == true ? 1 : 0);
						
						
						OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
					}
					if(missScript.visibleAtPilot){
						
	
				
						Vector3 diffVector = objectList[i].transform.position - theShip.transform.position;
						diffVector = Quaternion.Inverse(theShip.transform.rotation) * diffVector;
						diffVector *= 0.2f;		
						
						if(diffVector.magnitude < 50000 && missScript.enabled){
							msg  = new OSCMessage("/radar/update");		
							msg.Append<int>( missScript.targetId );
							msg.Append<String>(missScript.objectName);		
							msg.Append<float>(diffVector.x);
							msg.Append<float>(diffVector.y);
							msg.Append<float>(diffVector.z);
							string col = "" + missScript.colour.r + ":" + missScript.colour.g + ":" + missScript.colour.b;
							msg.Append<String>(col);
							msg.Append<String>(missScript.stateText);	
							msg.Append<int>(missScript.highlighted == true ? 1 : 0);
							msg.Append<String>(statString);
							msg.Append<int> (missScript.doNotInterpolate == true ? 1 : 0);
	
							//TODO
							// add a confidence value here and use it to jitter the radar results around. This relates to amount of power going to sensors
							//OSCHandler.Instance.SendMessageToAll( msg);
							OSCHandler.Instance.SendMessageToClient("PilotStation", msg);
	
						}
					}
					missScript.doNotInterpolate = false;
					
				
					
				}
			}
				
		}
		
		
			
	}
	
	/* update the radar tracking lists */
	public void updateTrackingList(){
		Transform[] list = (Transform[])FindObjectsOfType(typeof(Transform));
		objectList = new System.Collections.Generic.List<TargettableObject>(0);
	
		
		
		foreach(Transform go in list){
			//if(go.parent == null){
				TargettableObject rItem = go.GetComponent<TargettableObject>();
				
				if(rItem != null){
					
					objectList.Add(rItem);
				}			
			//}
		}
		UnityEngine.Debug.Log(objectList.Count + "radar items");
		
				
	}


}
