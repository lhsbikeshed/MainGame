using UnityEngine;
using System;
using UnityOSC;


public class DockingComputer:MonoBehaviour{
	
	public Transform theShip;
	
	public bool systemEnabled = false;
	
	
	public int lockingState = NO_SIGNAL;
	public bool hasEntered = false;
	
	public static int NO_SIGNAL = 0;
	public static int LOCKING_SIGNAL = 1;
	public static int SIGNAL_LOCKED = 2;
	
	/* Ship enters docking area
	 * ship automatically starts tracking this object
	 * once aligned, hand back controls to pilot
	 * if ship leaves the area then hand back controls
	 * show the aligment screen on pilot
	 */
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		
	}
	
	public void Update() {
		if(systemEnabled){
			if(lockingState != NO_SIGNAL){
				//theShip.transform.LookAt(transform);
				Quaternion lookAt = Quaternion.LookRotation(-(theShip.position - transform.position));
				theShip.transform.rotation = Quaternion.RotateTowards(theShip.rotation, lookAt, Time.deltaTime * 10f);
				Vector3 shipDir = theShip.TransformDirection(Vector3.forward).normalized;
				float direction = Vector3.Dot(shipDir, (theShip.position - transform.position).normalized);
				//Debug.Log(direction);
				if(direction <= -0.94f){
					lockingState = SIGNAL_LOCKED;
				} else {
					lockingState = LOCKING_SIGNAL;
				}
			}
		}
	
	}
	
	public void OnDrawGizmos(){
		Vector3 v = transform.TransformDirection(Vector3.forward);
		
		
		Gizmos.DrawLine(transform.position, transform.position + v * 500);
	}
	
	
	
	public void TurnOn(){
		if(!systemEnabled){
			systemEnabled  = true;
			
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "dockingtest");
			lockingState = NO_SIGNAL;
			hasEntered = false;
		}
	}
	
	public void TurnOff(){
		if(systemEnabled){
			systemEnabled = false;
			OSCHandler.Instance.RevertClientScreen("PilotStation", "dockingtest");
			hasEntered = false;
		}
	}
	
	public void Entered(){
		lockingState = LOCKING_SIGNAL;
		hasEntered = true;
		
	}
	
	public void OnTriggerEnter(Collider c){
		if(systemEnabled){
			if(c.name == "TheShip"){
				//send out docking screen
				Entered();
				
			}
		}
	}
	
	public void OnTriggerExit(Collider c){
		if(systemEnabled){
			if(c.name == "TheShip"){
				//revert the pilot screen to radar
				hasEntered = false;
				lockingState = NO_SIGNAL;
				OSCMessage m = new OSCMessage("/system/dockingComputer/dockingPosition");
				m.Append(-4.0f);
				m.Append(-4.0f);
				m.Append(-4.0f);
				m.Append(1.0f);
				m.Append(100.0f);
				m.Append(lockingState);
				OSCHandler.Instance.SendMessageToClient("PilotStation", m);
			}
		}
	}
	
	public void OnTriggerStay(Collider c){
		if(c.name == "TheShip" ){
			if(systemEnabled){
			
				/* catches the ship being insie the trigger when the comp is activated */
				if(hasEntered == false){
					Entered();
				}
				
			
				
				//send out y,x coords, z is distance to bay
				Vector3 shipPos = transform.InverseTransformPoint(theShip.position);
				
				//work out which direction the ship is facing
				Vector3 shipDir = transform.InverseTransformDirection(theShip.TransformDirection(Vector3.forward));
				float direction = Vector3.Dot(shipDir, transform.TransformDirection(Vector3.forward));
				
				float distance = shipPos.magnitude;
				
				OSCMessage m = new OSCMessage("/system/dockingComputer/dockingPosition");
				m.Append(shipPos.x);
				m.Append(shipPos.y);
				m.Append(shipPos.z);
				m.Append(direction);
				m.Append(distance);
				m.Append(lockingState);
				OSCHandler.Instance.SendMessageToClient("PilotStation", m);
				
			}
		}
		
	}
}