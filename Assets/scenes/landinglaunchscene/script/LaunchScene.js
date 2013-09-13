#pragma strict

class LaunchScene extends GenericScene {


	private var dockChamber : DockChamberScript;
	private var theShip : Transform;
	
	function Start () {
		dockChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
		theShip = GameObject.Find("TheShip").transform;
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (false);
	}
	
	function Update () {
	
	}
	
	
	
	function ProcessOSCMessage(message : OSCPacket){
	
		var msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		var target = msgAddress[2];
		var operation = msgAddress.length > 2 ? msgAddress[3] : 0;
		
		
		switch(operation){
			case "startLaunch":
				GameObject.Find("InternalDoor").GetComponent.<DoorScript>().openDoor();
				GameObject.Find("ShipMover").GetComponent.<LaunchSequencer>().begin();
				break;
				
			case "dockingBay":			//-----open docking bay hal -----
				//var dockingChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				if (dockChamber == null){ return; }
				
				if (message.Data[0]  == 1){		
					dockChamber.openDoor();
					GameObject.Find("STATIOn").GetComponent.<Station>().rotating = true;
				} else { 
					dockChamber.closeDoor();
				}
				break;
			case "bayGravity":
				//var dockingBayScript = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				if (dockChamber == null){ return; }
				dockChamber.setGravity( message.Data[0] == 1 ? true : false );
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
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "docking");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}

}