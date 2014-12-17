#pragma strict


/* ship enters Scene
 * comet storm starts
 * ship takes a big hit and the cablepuzzle starts
 * lock the ships rotation to point at the large comet
 * wait for cable puzzle to complete
 * once complete trigger the code auth for emergency jump on engineer
 * configure jump system for emergency and continue to warzone scene
 */
public class CometScene extends GenericScene implements CodeAuthSystem.AuthCodeListener {

	public var mainComet : Transform;
	public var distanceToDeath : float = 1000f;
	public var theShip : Transform;
	public var skyboxCamera : Transform;
	
	public var rockSpawner : CometRockSpawner;
	
	var cablePuzzleSystem : CablePuzzleSystem;
	
	var puzzleState = PuzzleState.STATE_ENTER;

	var ambientPingNoises : AudioClip[];
	private var lastPingNoise : float = 0f;
	private var nextPingNoise : float = 1f;
	
	private var inTunnel = false;
	private var tunnelExited = false;
	private var exitPercentage : float =0.0f;
	
	
	var minRangeForRocks : float = 7000f;
	var maxRangeForRocks : float = 30000f;
	
	
			
	function Start () {
		skyboxCameraActive = true;
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
		cablePuzzleSystem = theShip.GetComponent.<CablePuzzleSystem>();
		//CodeAuthSystem.Instance.addListener(this);

		startScene();
		//lock the jump system with a requirement telling the players they need to clear the gravity well of the asteroid first
		JumpSystem.Instance.addRequirement(new SystemRequirement("GRAVITYWELL", "Large Gravity well detected"));
	}

	function FixedUpdate () {
		//work out how far we are from the comet
		//trace a ray from the skyboxcamera to the main comet, take distance of first collision
		
		if(!inTunnel){
			calculateDistance();
			if(distanceToDeath < minRangeForRocks){
				rockSpawner.setRate(0f);	//turn off rocks close to the comet as they look shit
			} else {
				//scale the rate depending on distance
				var rate : float = UsefulShit.map(distanceToDeath, maxRangeForRocks, minRangeForRocks, 1, 10);
				rockSpawner.setRate(rate);
			}
		}
		
		if(puzzleState == puzzleState.STATE_CABLE){
			doCableWait();
		} 
		
		/* do random hull pinging noises */
		if(Time.fixedTime - lastPingNoise > nextPingNoise){
			lastPingNoise = Time.fixedTime;
			nextPingNoise = UsefulShit.map(distanceToDeath, minRangeForRocks, 0, 3, 1);
			nextPingNoise += Random.value * 2;
			var clip : AudioClip = ambientPingNoises[ Random.Range(0, ambientPingNoises.length) ];
			var tempAs : AudioSource = UsefulShit.PlayClipAt(clip, theShip.position + Random.onUnitSphere * 5f);
			tempAs.pitch = Random.Range(0.8f, 1.2f);
		}
		if(tunnelExited){
			exitPercentage = Mathf.Clamp(exitPercentage + 0.01f, 0.0f, 1.0f);
			GameObject.Find("Directional light").GetComponent.<Light>().intensity = 0.5f * exitPercentage;
			RenderSettings.ambientLight = Color(0.72, 0.72, 0.72) * exitPercentage;
		}

	}
	
	function calculateDistance(){
		var startPos : Vector3;
		var inDetailSpace = mainComet.GetComponent.<UniverseObject>().inDetailSpace;
		if(inDetailSpace){
			startPos = theShip.position;
		} else {
			startPos = skyboxCamera.position;
		}
		
		var hit : RaycastHit;
		var ray : Ray = Ray(startPos, mainComet.position - startPos);
		var collision : boolean = mainComet.GetComponentInChildren.<Collider>().Raycast(ray, hit, Mathf.Infinity);
		if(collision){
			distanceToDeath = hit.distance;
			if(inDetailSpace == false){
				distanceToDeath *= MapController._instance.iUniverseScale;
			}
		}
		
	}
	
	function enteredTunnel(){
		rockSpawner.gameObject.SetActive(false);
		mainComet.gameObject.SetActive(false);
		inTunnel = true;
		
	}
	
	function tunnelComplete(){
		Debug.Log("tunnel complete");
		puzzleComplete();
		inTunnel = false;
		mainComet.gameObject.SetActive(true);
		mainComet.position.z = 25698.77;
		
		tunnelExited = true;
	}
	
	
	
	/* wait for the cable puzzle to complete, once complete send out the auth screen stuff */
	function doCableWait(){	
		if(cablePuzzleSystem.hasBeenCompleted){
			//show the emergency jump auth screen
			puzzleState = puzzleState.STATE_CODE;
			CodeAuthSystem.Instance.startCodeRequest("EngineerStation", "EMERGENCY JUMP CODE", "62918", 100000);
		}
	}
	
	/* code ok, prepare the ship for emergency jump
	*/
	function puzzleComplete(){
			//clear the gravity well requirement as we're now outside of it.
			JumpSystem.Instance.removeRequirement("GRAVITYWELL");
	
			//turn on the jump system and set it to IDGAF ABOUT ROUTES mode. This is a fucking hack.
			theShip.GetComponent.<JumpSystem>().enableSystem();
			theShip.GetComponent.<PropulsionSystem>().enableSystem();
			var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			ps.hyperspaceDestination = 3;
			ps.forcedHyperspaceFail = false;	
			

			theShip.GetComponent.<JumpSystem>().canJump = true;
			theShip.GetComponent.<JumpSystem>().inGate = true;
			theShip.GetComponent.<JumpSystem>().jumpDest = 3;	//set dest to warzone scene
			//i dont think this class should be responsible for this
			var s1 : OSCMessage = OSCMessage("/ship/jumpStatus");
			s1.Append.<int>(1);
			OSCHandler.Instance.SendMessageToAll(s1);
			
			//tell the players the gravity well has been cleared
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "SUCCESS", "Gravity well cleared\r\nEngage hyperspace system to resume course", 4000);
	}
	
	function startScene(){
		//turn off the propulsion system but allow translation
		theShip.GetComponent.<PropulsionSystem>().disableSystem();
		theShip.GetComponent.<PropulsionSystem>().translationDisabled = false;	
		theShip.rigidbody.drag = 0.5f;	
		//turn off jumpSystem	
		theShip.GetComponent.<JumpSystem>().disableSystem();
		//play a failure sound effect of some sort
		
		cablePuzzleSystem.forceStart();
		puzzleState = puzzleState.STATE_CABLE;
		
		//now set the pilot screen to use the collision avoidance system
		OSCHandler.Instance.RevertClientScreen("PilotStation", "cablepuzzle");
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "collisionradar", false);
	}
	
	function LeaveScene(){
		CodeAuthSystem.Instance.removeListener(this);
		CodeAuthSystem.Instance.stopCodeRequest("EngineerStation");
	
	}

	function fireABastard(){
		rockSpawner.spawnInFrontOfPlayer();
	}
	


	function ProcessOSCMessage( msg : OSCPacket ){
		var msgAddress = msg.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		
		if(operation == "escape"){
			puzzleComplete();
			
		} else if (operation == "bastard"){
			fireABastard();
		}
	
	
	}

	function SendOSCMessage(){
		//send out a "distance to death" signal
		var msg : OSCMessage = OSCMessage("/ship/state/altitude");
		msg.Append(distanceToDeath);
		OSCHandler.Instance.SendMessageToAll(msg);
	
	}

	/* send out osc messages for client screens */
	function configureClientScreens(){}
	
	//callbacks from code aith
	function authCodeReturn(state : CodeAuthSystem.CodeState){
		if(puzzleState == puzzleState.STATE_CODE){
			Debug.Log("auth code return state : " + state);
			if(state == CodeAuthSystem.CodeState.CODE_OK){
				//yay! restore power and start emergency jump system
				puzzleComplete();
				
			}
		}
	}
	
	enum PuzzleState {
		STATE_ENTER = 0,
		STATE_CABLE = 1,
		STATE_CODE = 2,
		STATE_COMPLETE = 3,
	
	}
	
}