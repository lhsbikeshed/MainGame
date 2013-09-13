#pragma strict

class AsteroidScene extends GenericScene {
	
	private var theShip : GameObject;
	
	
	function Start () {
		theShip = gameObject.Find("TheShip");
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState(true);
		//set the ships camera up for a multi cam scene
		//set to DONOTCLEAR
		
	
	}
	
	function startPuzzle(){
		
		
		
	}
	
	
	
	function Update () {
	
	}
	
	
	function ProcessOSCMessage(message : OSCPacket){
	
		var msgAddress = message.Address.Split(separator);
		// [1] = system, 2 = thing, 3 = operation
		var target = msgAddress[2];
		var operation = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(operation){
			case "ass":
			   break;
				
		}
	
	
	}
	
	function SendOSCMessage(){}
	
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
	
}