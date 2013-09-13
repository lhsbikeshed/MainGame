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
		if(inHyperspace){
			if(hyperspaceStartTime + 5 < Time.fixedTime){
				tunnelExit();
				inHyperspace = false;
			}
		}
	}
	
	function tunnelExit(){
		theShip.GetComponent.<ship>().setJumpEffectState(false);
		theShip.GetComponent.<ship>().jumpEnd();
		hyperspaceEffects.layer = 9;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
		theShip.transform.position = Vector3(0,0,0);
		mapController.sectorPos = hyperspaceDestination;
		mapController.updateObjects();
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	}
	
	function tunnelStart(){
		inHyperspace = true;
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace");			
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace");		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "hyperspace");		
		
		//freeze ship
		hyperspaceEffects.layer = 0;
		theShip.rigidbody.constraints = RigidbodyConstraints.FreezeAll;
		theShip.transform.position = Vector3(5000,5000,5000);
		theShip.transform.rotation = Quaternion.identity;
		
		hyperspaceStartTime = Time.fixedTime;
		
		
	}
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
}