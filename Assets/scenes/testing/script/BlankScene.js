#pragma strict

class BlankScene extends GenericScene {
	

	private var theShip : GameObject;


	function Start () {
		theShip = GameObject.Find("TheShip");
	

	}
	
	function FixedUpdate () {
		
	}
	
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "plottingDisplay");			//give the engineer power man console
	
	}
	function ProcessOSCMessage(message : OSCPacket){
		var msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		var target = msgAddress[2];
		var operation = msgAddress.length > 2 ? msgAddress[3] : 0;
		
		
		switch(operation){
			case "dockingCompState":
				var g : GameObject = GameObject.Find("DockingComp");
				if(g != null){
					var s : int = message.Data[0];
					if(s == 0){
						g.GetComponent.<DockingComputer>().TurnOff();
					} else {
						g.GetComponent.<DockingComputer>().TurnOn();
					}
				}
				break;
		}
	}
	
	
	
}