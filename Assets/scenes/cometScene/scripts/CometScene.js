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
	
			
	function Start () {
		skyboxCameraActive = true;
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
		cablePuzzleSystem = theShip.GetComponent.<CablePuzzleSystem>();
		CodeAuthSystem.Instance.addListener(this);

		startScene();
	}

	function FixedUpdate () {
		distanceToDeath = (skyboxCamera.position - mainComet.position).magnitude;
		if(distanceToDeath < 900){
			rockSpawner.setRate(0f);	//turn off rocks close to the comet as they look shit
		} else {
			//scale the rate depending on distance
			var rate : float = UsefulShit.map(distanceToDeath, 2700, 500, 1, 10);
			rockSpawner.setRate(rate);
		}
		
		if(puzzleState == puzzleState.STATE_CABLE){
			doCableWait();
		} else if(puzzleState == puzzleState.STATE_CODE){
			doCodeWait();
		}
		
		/* do random hull pinging noises */
		if(Time.fixedTime - lastPingNoise > nextPingNoise){
			lastPingNoise = Time.fixedTime;
			nextPingNoise = UsefulShit.map(distanceToDeath, 2700, 0, 3, 1);
			nextPingNoise += Random.value * 2;
			var clip : AudioClip = ambientPingNoises[ Random.Range(0, ambientPingNoises.length) ];
			var tempAs : AudioSource = UsefulShit.PlayClipAt(clip, theShip.position + Random.onUnitSphere * 5f);
			tempAs.pitch = Random.Range(0.8f, 1.2f);
		}
		
		
//		var lookAt : Quaternion = Quaternion.LookRotation(-Vector3.forward);
//		theShip.transform.rotation = Quaternion.RotateTowards(theShip.rotation, lookAt, Time.deltaTime * 10f);
//		var shipDir : Vector3 = theShip.TransformDirection(Vector3.forward).normalized;
//		var direction : float = Vector3.Dot(shipDir, (theShip.position - mainComet.position).normalized);

	}
	
	/* wait for the auth code to complete*/
	function doCodeWait(){
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
			CodeAuthSystem.Instance.stopCodeRequest("EngineerStation");
			theShip.GetComponent.<JumpSystem>().enableSystem();
			theShip.GetComponent.<PropulsionSystem>().enableSystem();
			var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			ps.hyperspaceDestination = 3;
			ps.forcedHyperspaceFail = false;	
			

			theShip.GetComponent.<JumpSystem>().canJump = true;
			theShip.GetComponent.<JumpSystem>().inGate = true;
			theShip.GetComponent.<JumpSystem>().jumpDest = 3;	//set dest to warzone scene
			var s1 : OSCMessage = OSCMessage("/ship/jumpStatus");
			s1.Append.<int>(1);
			OSCHandler.Instance.SendMessageToAll(s1);
			
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "SUCCESS", "ENGAGE JUMP DRIVE", 4000);
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

	


	function ProcessOSCMessage( msg : OSCPacket ){
		var msgAddress = msg.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		
		if(operation == "escape"){
			puzzleComplete();
			
		}
	
	
	}

	function SendOSCMessage(){}

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
		STATE_COMPLETE = 3
	}
	
}