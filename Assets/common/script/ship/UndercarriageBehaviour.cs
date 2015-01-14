using UnityEngine;
using System;
using UnityOSC;


public class UndercarriageBehaviour:MonoBehaviour{
	
	public Transform[] colliders;
	
	public int state = 1;
	
	
	public int howManyInContact = -1;	//how many feet are touching the docking bay?
	
	public AudioClip transitSound;
	
	
	public bool forPlayer = true;
	
	bool[] contactsThisFrame;	//has the collider contacted this frame?
	public float wheelUpPos = 0.1f;
	public float wheelDownPos = -0.7f;
	public float speed = 0.1f;
	float wheelPosition = -0.7f;
	
	public static int UP = 0;
	public static int DOWN = 1;
	public static int TRANSIT_DOWN = 2;
	public static int TRANSIT_UP = 3;
	
	
	
	
	public void Start() {
		
		
		
		contactsThisFrame = new bool[colliders.Length];
		wheelPosition = wheelDownPos;
		if(state == DOWN){
			SystemRequirement sysReq = new SystemRequirement("GEAR", "Raise landing gear");
			JumpSystem.Instance.addRequirement(sysReq);
		}
		
	}
	//true for collide, false for not
	public void updateFootColliders(bool st){
		foreach(UnityEngine.Transform g in colliders){
			g.collider.isTrigger = !st;
		}
	}
	
	public void Update() {
		Transform g = null;
		if(state == TRANSIT_DOWN){
			if(wheelPosition >= wheelDownPos){
				wheelPosition = Mathf.MoveTowards(wheelPosition, wheelDownPos - 0.01f, speed * Time.deltaTime);
			} else {
				state = DOWN;
				
				//updateFootColliders(true);
				if(forPlayer){
					OSCMessage msg = new OSCMessage("/ship/undercarriage");
					msg.Append<int>(state);
					OSCHandler.Instance.SendMessageToAll(msg);
					OSCMessage tm = new OSCMessage("/ship/effect/playSound");
					tm.Append("gearExtended");
					OSCHandler.Instance.SendMessageToClient("PilotStation", tm);
					
					//update the jump system requirements to prevent jumping with undercarriage down
					SystemRequirement sysReq = new SystemRequirement("GEAR", "Raise landing gear");
					JumpSystem.Instance.addRequirement(sysReq);
					
					
				}
			}
			
		} else if(state == TRANSIT_UP){
			if(wheelPosition <= wheelUpPos){
				wheelPosition = Mathf.MoveTowards(wheelPosition, wheelUpPos + 0.01f, speed * Time.deltaTime);
			} else {
				state = UP;
				
				
				//updateFootColliders(false);
				if(forPlayer){
					OSCMessage msg2 = new OSCMessage("/ship/undercarriage");
					msg2.Append<int>(state);
					OSCHandler.Instance.SendMessageToAll(msg2);
					OSCMessage t = new OSCMessage("/ship/effect/playSound");
					t.Append("gearRetracted");
					OSCHandler.Instance.SendMessageToClient("PilotStation", t);
					JumpSystem.Instance.removeRequirement("GEAR");
					
				}
			}
			
		}
		for(int i = 0; i < colliders.Length; i ++){
			g = colliders[i];
			var tmp_cs1 = g.localPosition;
            tmp_cs1.y = wheelPosition;
            g.localPosition = tmp_cs1;
				
		}
		
	}
	
	public int getGearState(){
		return state;
	}
	
	
	//if intransit and up : enable the colliders and move them down to position
	//if intransit and down: move up and disable at end of transit
	[RPC]
	public void setGearState(bool newState){
		OSCMessage msg = new OSCMessage("/ship/undercarriage");
		
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
		msg.Append<int>(state);
		if(forPlayer){
			OSCHandler.Instance.SendMessageToAll(msg);
	//		if(PersistentScene.networkReady == true){
	//			networkView.RPC ("setGearState", RPCMode.Others, newState);
	//		}
		}
	}
	
	public void OnCollisionStay(Collision c){
		int ct = 0;
		
		for(int i = 0; i < contactsThisFrame.Length; i++){
			contactsThisFrame[i] = false;
		}
		
		foreach(ContactPoint cp in c.contacts){
			int colCount = 0;
			foreach(Transform col in colliders){
				Collider footCollider = col.GetComponent<Collider>();
				if(cp.thisCollider == footCollider && contactsThisFrame[colCount] == false){
					ct ++;
					contactsThisFrame[colCount] = true;
					
				}
				colCount++;
			}
		}
		
		if(howManyInContact != ct){
			if(forPlayer){
				OSCMessage msg = new OSCMessage("/ship/undercarriage/contact");
				if(ct >= 3){		//number of feet in contact has changed and its now 4, let everyone know clamp can be used
					msg.Append<int>(1);
					OSCHandler.Instance.SendMessageToAll(msg);
				} else if(howManyInContact >= 3){		//number of feet has changed and it WAS 4, clamp disabled
					msg.Append<int>(0);
					OSCHandler.Instance.SendMessageToAll(msg);
				}
			}
		}
		
		
		howManyInContact = ct;
		
	}


}
