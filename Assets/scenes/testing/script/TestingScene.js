#pragma strict

class TestingScene extends GenericScene {
	

	var hyperspaceDestination : int[];
	var hyperspaceEffects : GameObject;
	private var hyperspaceStartTime : float;
	
	private var theShip : GameObject;
	private var inHyperspace : boolean = false;
	
	private var mapController : MapController;
	function Start () {
		theShip = GameObject.Find("TheShip");
		mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();

	}
	
	function FixedUpdate () {
		
	}
	
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
}