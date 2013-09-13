#pragma strict

class LandingScene extends GenericScene {
	
	private var theShip : Transform;
	private var dockChamber : DockChamberScript;

	function Start () {
		GameObject.Find("STATIOn").GetComponent.<Station>().rotating = true;
		dockChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();

		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
		theShip.GetComponent.<PropulsionSystem>().enableSystem();
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (false);
		
		
		
		
	}
	
	function Update () {
	
	}
	
	//OSC HANDLER
	
	function ProcessOSCMessage(message : OSCPacket){
	
		var msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		var target = msgAddress[2];
		var operation = msgAddress.length > 2 ? msgAddress[3] : 0;
		
		
		switch(operation){
			case "startDock":
				GameObject.Find("InternalDoor").GetComponent.<DoorScript>().openDoor();
				GameObject.Find("ShipMover").GetComponent.<LaunchSequencer>().begin();
				break;
			case "dockingBay":			//-----open docking bay hal -----
				var dockingChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				if (dockingChamber == null){ return; }
				
				if (message.Data[0]  == 1){		
					dockingChamber.openDoor();
				} else { 
					dockingChamber.closeDoor();
				}
				break;
			case "bayGravity":
				var dockingBayScript = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				if (dockingBayScript == null){ return; }
				dockingBayScript.setGravity( message.Data[0] == 1 ? true : false );
				break;
		}
	
	
	}
	
	function SendOSCMessage(){
		if(dockChamber.inBay == true){
			var pos : Vector3 = theShip.transform.localPosition;
			var rot : Quaternion = theShip.transform.localRotation;
			var msg : OSCMessage = OSCMessage("/scene/launchland/dockingPosition");
			msg.Append.<float>(pos.x);
			msg.Append.<float>(pos.y);
			msg.Append.<float>(pos.z);
			
			msg.Append.<float>(rot.eulerAngles.x);
			msg.Append.<float>(rot.eulerAngles.y);
			msg.Append.<float>(rot.eulerAngles.z);
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	
	
	}
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a radar comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}

	
}