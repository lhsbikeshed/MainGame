#pragma strict

class Hyperspace extends GenericScene {
	/*
	OUTPUT
	/warpscene/failjump		x = seconds until exit
	/warpscene/exitjump
	
	*/
	
	var destination : int; //destination scene when we exit
	var maxTimeInScene : float; //how long before we naturally exit the stream
	var maxMissedKeepalives : int ; //how many failures the engineer can do before we failexit
	var forceFail : boolean;		//are we forced to fail(eg in first jump scene)
	var failSfx : AudioClip[] ; 	//list of sound effects for failures
	var gravityFailSfx : AudioClip;	//sound to play during failed exit
	
	var rotatorObject : Transform; //parent to the particles and ship for rotation goodness
	
	@HideInInspector
	
	private var lastEngineeringUpdate : float;
	
	private var failTime : float; //time of failures, used to time colour changes in the warp particles
	private var warpParticles : ParticleSystem ;
	
	var missedKA : int;
	private var sceneEntryTime : float = -10;
	private var exiting : boolean = false;
	private var failing : boolean = false;
	
	private var fallingTowardPlanet : boolean = false;
	
	//refs 
	private var theShip : GameObject; //the ship
	private var ps: PersistentScene;	//global crap
	private var oscSender : OSCSystem;
	
	function Start () {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		theShip.transform.parent = rotatorObject;
		
		theShip.rigidbody.velocity = Vector3(0,0,0);
		sceneEntryTime = Time.fixedTime;
		theShip.rigidbody.freezeRotation = true;
		theShip.rigidbody.constraints = RigidbodyConstraints.FreezeAll;
		//reset the camera in case we came from a dynamic skybox scene
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (false);
		
		
		theShip.GetComponent.<ship>().setJumpEffectState(false);
		theShip.GetComponent.<ship>().inGate = false;
		theShip.GetComponentInChildren.<Camera>().backgroundColor = Color(0,0,0);
		lastEngineeringUpdate = Time.fixedTime;
		ps = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>();
		warpParticles = GameObject.Find("warp bits").GetComponent.<ParticleSystem>();
		theShip.GetComponent.<MiscSystem>().consuming = false;	//temporarily disable oxygen consumption
		
		 theShip.GetComponent.<PropulsionSystem>().throttleDisabled = true;
		  
	}
	
	function FixedUpdate () {
		/*if(lastEngineeringUpdate + 5.0 < Time.fixedTime){
			missedKA ++;
			lastEngineeringUpdate = Time.fixedTime;
					
		}*/
		if(missedKA >= maxMissedKeepalives && !exiting){
			startExit(false);
			
		}
		if(Time.fixedTime > sceneEntryTime + maxTimeInScene && !exiting){
			
			Debug.Log("EXITING " + Time.fixedTime + " "  + (sceneEntryTime + maxTimeInScene));
			startExit(ps.forcedHyperspaceFail);
			
		}
		
		
		if(exiting && failing){
			warpParticles.transform.rotation *= Quaternion.Euler(0,0,Random.Range(-3,3));
		}
		
		if(failTime + 1 > Time.fixedTime){
			warpParticles.startColor = Color(255,0,0);
		} else {
			warpParticles.startColor = Color(0,89,107);
		}
		if(ps.forcedHyperspaceFail && getTimeRemaining() < 5.0f && !fallingTowardPlanet){
			fallingTowardPlanet = true;
			var g : GameObject = GameObject.Find("DynamicCamera");
			if(g != null){
				g.GetComponent.<DynamicCamera>().hideCabinCamera();
				g.GetComponent.<DynamicCamera>().canCabinCamBeUsed = false;
			}
		}
		if(fallingTowardPlanet){
		
			rotatorObject.rotation = Quaternion.Euler(0.1, 0.0, 0.0) * rotatorObject.rotation;
		}
	}
	
	function getTimeRemaining(){
		return (sceneEntryTime + maxTimeInScene) - Time.fixedTime;
	}
	
	function hadAFail(){
		missedKA++;
		failTime = Time.fixedTime;
		AudioSource.PlayClipAtPoint(failSfx[ Random.Range(0,failSfx.length) ], theShip.transform.position);
		theShip.GetComponent.<ship>().damageShip(Random.Range(3,10), "Broken apart by hyperspace disturbances");
	}
	
	
	
	//start the exit process
	function startExit(failure : boolean){
		if(exiting == false){
			exiting = true;
			failing = failure;
			warpParticles.startColor = Color(255,0,0);
			//change animations
			//send an osc message /warp/failed {time to failure}
			theShip.GetComponent.<ship>().setJumpEffectState(true);
			if(failure){
				//power off propulsion/warp and send a general UREFUCKED effects message
				//theShip.GetComponent.<PropulsionSystem>().disableSystem();
				//theShip.GetComponent.<JumpSystem>().disableSystem();
				//broadcast that we failed the jump
				var msg : OSCMessage = OSCMessage("/scene/warp/failjump");		
				msg.Append.<int>( 10 ); // 10 seconds until exit fail			
				OSCHandler.Instance.SendMessageToAll(msg);
				//see if there is a planet in the scene and fire it off
				AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
				
				//slowly rotate the ship downward toward the approaching planet
				
				//SPIN THE MOTHERFUCKING SHIP YO
				//theShip.rigidbody.constraints = RigidbodyConstraints.FreezePosition;
				//theShip.rigidbody.angularDrag = 0.0f;
				//theShip.rigidbody.AddRelativeTorque(Vector3(0.0f, 0.0f, 120.0f), ForceMode.Impulse); 
				
				
			} else{
				var msg2 : OSCMessage = OSCMessage("/scene/warp/exitjump");		
				msg2.Append.<int>( 10 ); // 10 seconds until exit fail
				OSCHandler.Instance.SendMessageToAll(msg2);
			}
			yield WaitForSeconds(10.0);
			
			theShip.rigidbody.freezeRotation = false;
			theShip.rigidbody.constraints = RigidbodyConstraints.None;
			theShip.GetComponent.<ship>().didWeWarpIn = true;
			theShip.GetComponent.<MiscSystem>().consuming = true; //reenable air consumption
			theShip.rigidbody.angularDrag = 0.5f;
		 	theShip.GetComponent.<PropulsionSystem>().throttleDisabled = false;

			theShip.transform.parent = null;
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
		msg.Append.<float>(maxMissedKeepalives - missedKA);		
		msg.Append.<float>(getTimeRemaining());		
		msg.Append.<int>(ps.forcedHyperspaceFail == true ? 1 : 0);
		OSCHandler.Instance.SendMessageToAll( msg);	
	}
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace");			
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace");		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "hyperspace");			
	
	}
	
}