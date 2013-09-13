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
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
}