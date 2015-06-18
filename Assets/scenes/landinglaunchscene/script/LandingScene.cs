using UnityEngine;
using System;
using UnityOSC;

[System.Serializable]
public class LandingScene: GenericScene {
	
	Transform theShip;
	DockChamberScript dockChamber;

	public bool autoTest = false;
	
	
	
	public override void Start() {
		GameObject.Find("STATIOn").GetComponent<Station>().rotating = true;
		dockChamber = GameObject.Find("DockChamber").GetComponent<DockChamberScript>();

		theShip = GameObject.Find("TheShip").transform;
		theShip.GetComponent<Rigidbody>().useGravity = false;
		theShip.GetComponent<PropulsionSystem>().enableSystem();
		theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (false);
		
		
		
		
	}
	
	public override void Update() {
		if(autoTest){
			autoTest = false;
			startAutoPilot();
		}
	
	}
	
	
	
	public void AutopilotFail(){
		OSCMessage m = new OSCMessage("/system/control/controlState");
		m.Append(0);
		OSCHandler.Instance.SendMessageToClient("PilotStation", m);
	}
	
	public void startAutoPilot(){
	
		Autopilot autopilot = null;
		//find the waypoints from targettrack
		GameObject targetTrack = GameObject.Find("TargetTrack");
		if(targetTrack != null){
		
			autopilot = targetTrack.GetComponent<Autopilot>();
			if(autopilot.running == false){
				
				OSCMessage m = new OSCMessage("/system/control/controlState");
				m.Append(1);
				OSCHandler.Instance.SendMessageToClient("PilotStation", m);
				
				Transform[] objList = targetTrack.GetComponent<TargetTrackController>().objectList;
				
				for(int i = 1; i < objList.Length; i++){
				//set a callback on the second to last beacon to "fail" the autopilot
					if(i == objList.Length - 1){
						//TODO: objList[i].GetComponent<SequenceWaypoint>().OnArrive = AutopilotFail;
					}
					autopilot.AddWaypoint( objList[i].GetComponent<SequenceWaypoint>());
					
				}
				autopilot.StartFlight();
			}
				
		
		} else {
			UnityEngine.Debug.Log("no waypoints found");
			return;
		}
		//set them (minus the 0 element) to the autopilot
		//start it
	}
	
	public void stopAutopilot(){
	
		Autopilot autopilot = null;
		GameObject targetTrack = GameObject.Find("TargetTrack");
		if(targetTrack != null){
			UnityEngine.Debug.Log("Stopping autopilot..");
			autopilot = targetTrack.GetComponent<Autopilot>();
			if(autopilot.running == true){
				autopilot.PauseFlight();
			}
		}
		theShip.GetComponent<ShipCore>().setControlLock(false);
	}
	
	//OSC HANDLER
	
	public override void ProcessOSCMessage(OSCPacket message){
	
		string[] msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		string target = msgAddress[2];
		string operation = msgAddress.Length > 2 ? msgAddress[3] : "" + 0;
		
		
		switch(operation){
			case "startDock":
				GameObject.Find("InternalDoor").GetComponent<DoorScript>().openDoor();
				StartCoroutine(GameObject.Find("ShipMover").GetComponent<LaunchSequencer>().begin());
				break;
			case "dockingBay":			//-----open docking bay hal -----
				DockChamberScript dockingChamber = GameObject.Find("DockChamber").GetComponent<DockChamberScript>();
				if (dockingChamber == null){ return; }
				
				if ((int)message.Data[0]  == 1){		
					dockingChamber.openDoor();
				} else { 
					dockingChamber.closeDoor();
				}
				break;
			case "bayGravity":
				DockChamberScript dockingBayScript = GameObject.Find("DockChamber").GetComponent<DockChamberScript>();
				if (dockingBayScript == null){ return; }
				dockingBayScript.setGravity( (int)message.Data[0] == 1 ? true : false );
				break;
			case "autodock":
				startAutoPilot();
				break;
			case "stopautodock":
				
				stopAutopilot();
				break;
			case "dockingCompState":
				GameObject g = GameObject.Find("DockingComp");
				if(g != null){
					int s = (int)message.Data[0];
					if(s == 0){
						g.GetComponent<DockingComputer>().TurnOff();
					} else {
						g.GetComponent<DockingComputer>().TurnOn();
					}
				}
				break;
		}
	
	
	}
	
	public override void SendOSCMessage(){
		if(dockChamber.inBay == true){
			Vector3 pos = theShip.transform.localPosition;
			Quaternion rot = theShip.transform.localRotation;
			OSCMessage msg = new OSCMessage("/scene/launchland/dockingPosition");
			msg.Append<float>(pos.x);
			msg.Append<float>(pos.y);
			msg.Append<float>(pos.z);
			
			msg.Append<float>(rot.eulerAngles.x);
			msg.Append<float>(rot.eulerAngles.y);
			msg.Append<float>(rot.eulerAngles.z);
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	
	
	}
	
	public override void configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a radar comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}

	
}
