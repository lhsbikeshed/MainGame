#pragma strict
class JumpSystem extends BaseSubsystem
{

	var jumpChargePercent : float;	//0->1 of how charged system is
	var chargeRate : float;			//to tweak jump charge rates
	//var jumpRoute : int = -1 ;		//-1 = no route set, other values determine the "route" to take on the printed maps. Currently only 0 is used (mars drop)
									
									
									
									
	private var jumpEffect : ParticleSystem;

	private var soundSource : AudioSource;
	var chargeSound : AudioClip;
	var openSound : AudioClip;
	var initialisedSound : AudioClip;
	private var discharging : boolean = false;
	//JUMP STUFF

	var didWeWarpIn : boolean;	//did we jump into this scene?
	var canJump : boolean;		//are we allowed to jump? Used by Jump Node
	var inGate : boolean;		//are we in a gate
	var inTunnelGate : boolean; //are we in a tunnel gate?
	public var jumpDest : int;	//where we jump to after the hyperspace scene is finished
	
	var jumping : boolean;			//are we currently accelerating for a jump?
	private var jumpStartTime : float;		//time we started the jump, jump sequence lasts 7 seconds
	private var restoreFov : boolean;			//when a jump is aborted we need to restore fov

	private var cablePuzzleFailTimer : float = 0.0f;
	private var shipCamera : ShipCamera;
	private var theCamera : Transform;
	
	var jumpBlocked : boolean;
	
	public static var Instance : JumpSystem;

	function Awake(){
		super.Awake();
		Instance = this;
	}
		
	function Start () {
		super();
		soundSource = gameObject.AddComponent("AudioSource");
		soundSource.pitch = 1.0;
		soundSource.clip = chargeSound;
		
				
		theCamera = theShip.Find("camera").transform;

		jumpEffect = transform.Find("JumpEffects").GetComponent.<ParticleSystem>();
			shipCamera = gameObject.GetComponentInChildren.<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();

		setJumpEffectState(false);
		if(didWeWarpIn){
			restoreFov = true;
			shipCamera.setFovs(180);
		}
		
		jumpBlocked = false;
	}
	
	
	function repair(amount : float){
	}
	
	function go(){
		soundSource.Stop();
		soundSource.pitch = 1.0;
		soundSource.clip = openSound;
		soundSource.Play();
		AudioSource.PlayClipAtPoint(initialisedSound, transform.position);
	
	}
	
	function openSoundStart(){
		if(soundSource.isPlaying){
			return;
		}
		soundSource.pitch = 1.0;
		soundSource.clip = openSound;
		soundSource.Play();
		
	}
	
	
	function doJump(){
		
		
		disableSystem();
	}
	
	function enableSystem(){
		if(systemEnabled == false){
			systemEnabled = true;
			
			soundSource.loop = true;
			soundSource.clip = chargeSound;

			soundSource.Play();
			discharging = false;
			GetComponent.<PropulsionSystem>().hyperspaceModifier = true;
		}
	}
	
	function disableSystem(){
		if(systemEnabled){
			canJump = false;
			systemEnabled = false;
			//0jumpChargePercent = 0.0;
			//soundSource.Stop();
			discharging = true;
			canJump = false;
			updateJumpStatus();
			GetComponent.<PropulsionSystem>().hyperspaceModifier = false;
		}
	}
	
	function FixedUpdate () {
		if(systemEnabled){
				
			
			
				jumpChargePercent += (chargeRate * damage * powerState) / 100.0f;
				if(jumpChargePercent >= 1.0){
					jumpChargePercent = 1.0;
					canJump = true;
					updateJumpStatus();

				} else {
					canJump = false;
					updateJumpStatus();
				}
				soundSource.pitch = jumpChargePercent;
			
		} 
		if(discharging){
			jumpChargePercent -= 0.01;
			soundSource.pitch = jumpChargePercent;
			if(jumpChargePercent <= 0){
				jumpChargePercent = 0;
				discharging = false;
				soundSource.Stop();
			}
		}
		
		
	//if we are jumping then add a massive forward force to accel the ship
	//modify the effects in front of ship depending on how fast were going
	if(jumping){
		if(cablePuzzleFailTimer > 0.0f){
			cablePuzzleFailTimer -= Time.fixedDeltaTime;
			if(cablePuzzleFailTimer <= 0.0f){
				jumpAbort();
				var cab : CablePuzzleSystem = GetComponent.<CablePuzzleSystem>();
				cab.puzzleStart();
			}
		}
	
	
		rigidbody.AddForce (transform.TransformDirection(Vector3.forward * 15000));
		
		var timeSinceJumpStart = Time.fixedTime - jumpStartTime;
		if(Mathf.FloorToInt (timeSinceJumpStart - Time.fixedDeltaTime ) != Mathf.FloorToInt (timeSinceJumpStart)){
			var ti = 5 - Mathf.FloorToInt(timeSinceJumpStart);
			GetComponent.<DistanceSpeaker>().SpeakDistance(ti, 1, false);
		}
		if(timeSinceJumpStart > 2){	//turn on effects at 2 seconds
			
			setJumpEffectState(true);
			shipCamera.setFovs(85 + ((Time.fixedTime - jumpStartTime - 2) / 3.0f ) * 30);
		}
			
		//JUMP!
		if (timeSinceJumpStart  > 5){	//jump at 7 seconds
			
			resetAfterJump();
			var sceneScript  = GameObject.Find("SceneScripts");
			if(sceneScript != null){
				sceneScript.GetComponent.<GenericScene>().LeaveScene();
			}
			
			Application.LoadLevel(1);			
			Debug.Log("JUMP!");
			
			
		} 
	}
	
	//restore fov after a jump - not used until i split the guilayer and game into seperate cameras
	if (restoreFov){
		shipCamera.setFovs( Mathf.Lerp(theCamera.camera.fieldOfView,85,Time.deltaTime * 5.0) );
		if (theCamera.camera.fieldOfView <= 85.0f){
			shipCamera.setFovs(85.0f);
			restoreFov = false;
		}
		
	}
	
	}
	function OnLevelWasLoaded (level : int) {
		
	   	if(didWeWarpIn){
			resetAfterJump();
			jumpDest = -1; //players will have to plot again to escape
			setJumpEffectState(false);
			didWeWarpIn = false;
			shipCamera.setFovs(180);
		}
	}   
	
	function setJumpEffectState(state : boolean){
		
		if(jumpEffect == null){
			jumpEffect = transform.Find("JumpEffects").GetComponent.<ParticleSystem>();
		}
		if(state){
			jumpEffect.enableEmission = true;
		} else {
			jumpEffect.enableEmission = false;
		}
	}
	
	/* work out if we can actually jump or not and send that status to the clients
	*/
	function updateJumpStatus(){

		
		var msg : OSCMessage = OSCMessage("/ship/jumpStatus");	
		if(inGate && canJump && jumpDest >= 0){		
			msg.Append.<int>(1);		
		} else {
			msg.Append.<int>(0);
		}
		OSCHandler.Instance.SendMessageToAll(msg);
	}

	/* forcibly start the jump sequence, ignoring being in a gate or charged */
	function forceJump(){

		go();
		jumpStartTime = Time.fixedTime;
		theShip.GetComponent.<ShipCore>().setControlLock(true);
		jumping = true;
		rigidbody.drag = 0.05f;
		theShip.GetComponent.<PropulsionSystem>().rotationDisabled  = true;
	}

	/* Begin a jump sequence
	 * only works if we are inside a gate ring, the jump system reports its charged
	 * and we arent currently jumping (prevents idiots from spamming the jump button 
	*/
	function startJump(){	//TODO replace these with systemrequirements
		var noJumpReason : String = "Cannot jump\r\n";
		var jumpFail : boolean = false;
		
		if(TargettingSystem.instance.weaponState != WeaponState.WEAPON_STOWED){
			jumpFail = true;
			noJumpReason += "> Retract Weapons Bays\r\n";
		}
		if(jumpDest == -1){
			jumpFail = true;
			noJumpReason += "> No Route Set\r\n";
		}
		// other requirements are handled by the requirements system stuff. landing gear and gravity well so far.
		if(canBeUsed() ==  false){
			jumpFail = true;
			noJumpReason += getRequirementString();
		}
		if(jumpFail){
			//give the players the bad news
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Jump Error", noJumpReason, 3000);
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Jump Error", noJumpReason, 3000);
			OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "Jump Error", noJumpReason, 3000);
		}
		
		
		if(inGate && canJump && !jumping && jumpFail == false){
			
			go();
			jumpStartTime = Time.fixedTime;
			theShip.GetComponent.<ShipCore>().setControlLock(true);
			jumping = true;
			rigidbody.drag = 0.05f;
			theShip.GetComponent.<PropulsionSystem>().rotationDisabled  = true;
			
			//test switching the consoles to hyperspace early
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace", true);
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace", true);
			
			var cab : CablePuzzleSystem = GetComponent.<CablePuzzleSystem>();
			if(cab.isWaiting){
				cablePuzzleFailTimer = 1.0f;
			} 
			
			
		}
	}

	
	
	/* abort the jump, called if we smash into something during jumping
	*/
	function jumpAbort(){
		soundSource.Stop();
		theShip.GetComponent.<PropulsionSystem>().rotationDisabled  = false;
		theShip.GetComponent.<ShipCore>().setControlLock(false);
		jumping = false;
		rigidbody.drag = 1.0f;
		restoreFov = true;
		setJumpEffectState(false);
		OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
		GetComponent.<PropulsionSystem>().hyperspaceModifier = false;
	}


	/* tidy up all of the jump effects
	*/
	function resetAfterJump(){
		rigidbody.drag = 1.0f;
		theShip.GetComponent.<ShipCore>().setControlLock(false);
		theShip.GetComponent.<PropulsionSystem>().rotationDisabled  = false;
		jumping = false;
		restoreFov = true;
		GetComponent.<PropulsionSystem>().hyperspaceModifier = false;
		doJump();
		
		
	}   
	
	
	
	
	
	
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		
		if (operation == "state"){					//propulsion enable
				if (message.Data[0] == 0){
					disableSystem();
				} else {
					enableSystem();
				}
		} else if(operation == "doJump"){
			startJump();
		} else if (operation ==  "startJump"){
			startJump();
		} else if (operation == "setRoute"){
			var r : int = message.Data[0];
			Debug.Log("Set jump route : " + r);
			jumpDest = r;
			var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			ps.hyperspaceDestination = jumpDest;
			
			updateJumpStatus();
		} else if (operation == "clearRoute"){
			Debug.Log("Cleared jump route");
			jumpDest = -1;
			updateJumpStatus();
		}
			
			
	}
}