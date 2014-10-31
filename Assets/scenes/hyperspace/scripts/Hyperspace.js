#pragma strict

class Hyperspace extends GenericScene {
	/*
	OUTPUT
	/warpscene/failjump		x = seconds until exit
	/warpscene/exitjump
	
	*/
	
	var destination : int; //destination scene when we exit
	var maxTimeInScene : float; //how long before we naturally exit the stream
	
	var forceFail : boolean;		//are we forced to fail(eg in first jump scene)
	var failSfx : AudioClip[] ; 	//list of sound effects for failures
	
	
	
	var planetFallPrefab : Transform;
	var cometPrefab : Transform;
	
	@HideInInspector
	
	
	
	private var failTime : float; //time of failures, used to time colour changes in the warp particles
	private var warpParticles : ParticleSystem ;
	
	
	private var sceneEntryTime : float = -10;
	private var exiting : boolean = false;
	private var failing : boolean = false;
	
	private var fallingTowardPlanet : boolean = false;
	
	//refs 
	private var theShip : GameObject; //the ship
	private var ps: PersistentScene;	//global crap
	private var oscSender : OSCSystem;
	private var jumpSystem : JumpSystem;
	
	private var destinationScene :int = -1;
	
	function Start () {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		
		
		theShip.rigidbody.velocity = Vector3(0,0,0);
		sceneEntryTime = Time.fixedTime;
		theShip.rigidbody.freezeRotation = true;
		theShip.rigidbody.constraints = RigidbodyConstraints.FreezeAll;
		//reset the camera in case we came from a dynamic skybox scene
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (false);
		jumpSystem = theShip.GetComponent.<JumpSystem>();
		
		jumpSystem.setJumpEffectState(false);
		jumpSystem.inGate = false;
		theShip.GetComponentInChildren.<Camera>().backgroundColor = Color(0,0,0);
		
		ps = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>();
		warpParticles = GameObject.Find("warp bits").GetComponent.<ParticleSystem>();
		theShip.GetComponent.<MiscSystem>().consuming = false;	//temporarily disable oxygen consumption
		
		 theShip.GetComponent.<PropulsionSystem>().throttleDisabled = true;
		  
		  
		  
		destinationScene = ps.hyperspaceDestination;
		if(destinationScene == 2){
		
				
			//instantiate the planet fall prefab
			var t : Transform = Instantiate(planetFallPrefab, Vector3.zero, Quaternion.identity);
			t.GetComponent.<PlanetFallEvent>().triggerTime = maxTimeInScene - 5.0f;
		} else if (destinationScene == 7 ){
			//instantiate the planet fall prefab
			var t2 : Transform = Instantiate(cometPrefab, Vector3.zero, Quaternion.identity);
			t2.GetComponent.<CometEvent>().triggerTime = maxTimeInScene - 8.0f;
		}
		
	}
	
	function FixedUpdate () {
		
		
		if(Time.fixedTime > sceneEntryTime + maxTimeInScene && !exiting){
			
			Debug.Log("EXITING " + Time.fixedTime + " "  + (sceneEntryTime + maxTimeInScene));
			startExit(ps.forcedHyperspaceFail);
			
		}
		
		
		// fail colours
		if(failTime + 1 > Time.fixedTime){
			warpParticles.startColor = Color(255,0,0);
		} else {
			warpParticles.startColor = Color(0,89,107);
		}
	}
	
	function getTimeRemaining(){
		return (sceneEntryTime + maxTimeInScene) - Time.fixedTime;
	}
	
	function hadAFail(){
		
		failTime = Time.fixedTime;
		AudioSource.PlayClipAtPoint(failSfx[ Random.Range(0,failSfx.length) ], theShip.transform.position);
		theShip.GetComponent.<ShipCore>().damageShip(Random.Range(3,10), "Broken apart by hyperspace disturbances");
	}
	
	
	
	//start the exit process
	function startExit(failure : boolean){
		if(exiting == false){
			exiting = true;
			failing = failure;
			warpParticles.startColor = Color(255,0,0);
			//change animations
			//send an osc message /warp/failed {time to failure}
			theShip.GetComponent.<JumpSystem>().setJumpEffectState(true);
			if(failure){
				
				//broadcast that we failed the jump
				var msg : OSCMessage = OSCMessage("/scene/warp/failjump");		
				msg.Append.<int>( 10 ); // 10 seconds until exit fail			
				OSCHandler.Instance.SendMessageToAll(msg);
				//see if there is a planet in the scene and fire it off
				
				
			} else{
				var msg2 : OSCMessage = OSCMessage("/scene/warp/exitjump");		
				msg2.Append.<int>( 10 ); // 10 seconds until exit fail
				OSCHandler.Instance.SendMessageToAll(msg2);
			}
			yield WaitForSeconds(10.0);
			
			theShip.rigidbody.freezeRotation = false;
			theShip.rigidbody.constraints = RigidbodyConstraints.None;
			theShip.GetComponent.<JumpSystem>().didWeWarpIn = true;
			theShip.GetComponent.<MiscSystem>().consuming = true; //reenable air consumption
			theShip.rigidbody.angularDrag = 0.5f;
		 	theShip.GetComponent.<PropulsionSystem>().throttleDisabled = false;

			theShip.transform.parent = null;
			
			OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
			OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
			OSCHandler.Instance.RevertClientScreen("EngineerStation", "hyperspace");
			
			Application.LoadLevel(ps.hyperspaceDestination);
		}
		
		
	}
	
	
	//OSC handling
	function ProcessOSCMessage(msg : OSCPacket){
		var msgAddress = msg.Address.Split(separator);
		var target = msgAddress.length > 2 ? msgAddress[3] : 0;
		
		switch(target){				
			case "warpfail":				
					hadAFail();			
					break;			
		}	
	}
	
	function SendOSCMessage(){	
		var msg : OSCMessage = OSCMessage("/scene/warp/updatestats");
		msg.Append.<float>(0);		
		msg.Append.<float>(getTimeRemaining());		
		msg.Append.<int>(ps.forcedHyperspaceFail == true ? 1 : 0);
		msg.Append.<int>(jumpSystem.jumpDest);
		OSCHandler.Instance.SendMessageToAll( msg);	
	}
	
	function LeaveScene(){
		OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("EngineerStation", "hyperspace");
	}
	
	function configureClientScreens(){
		//pilot and tactical should already be in hyperspace screen at this point
		
		//OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace");			
		//OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace");		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "hyperspace", true);			
	
	}
	
}