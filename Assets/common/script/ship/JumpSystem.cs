using UnityEngine;
using System;
using UnityOSC;
[System.Serializable]
public class JumpSystem: BaseSubsystem
{

	public float jumpChargePercent;	//0->1 of how charged system is
	public float chargeRate;			//to tweak jump charge rates
	//var jumpRoute : int = -1 ;		//-1 = no route set, other values determine the "route" to take on the printed maps. Currently only 0 is used (mars drop)
									
									
	JumpEffects jumpEffects;					
									


	AudioSource soundSource;
	public AudioClip chargeSound;
	public AudioClip openSound;
	public AudioClip initialisedSound;
	bool discharging = false;
	//JUMP STUFF

	public bool didWeWarpIn;	//did we jump into this scene?
	//public bool canJump;		//are we allowed to jump? Used by Jump Node
	public bool inTunnelGate; //are we in a tunnel gate?
	public string  jumpDest;	//where we jump to after the hyperspace scene is finished
	public int jumpLength = 0;
	
	public bool jumping;			//are we currently accelerating for a jump?
	float jumpStartTime;		//time we started the jump, jump sequence lasts 7 seconds
	bool restoreFov;			//when a jump is aborted we need to restore fov

	float cablePuzzleFailTimer = 0.0f;
	ShipCamera shipCamera;

	
	public bool jumpBlocked;
	
	public static JumpSystem Instance;

	public override void Awake(){
		base.Awake();
		Instance = this;
	}
		
	public override void Start() {
		base.Start ();
		soundSource = gameObject.AddComponent<AudioSource>();
		soundSource.pitch = 1.0f;
		soundSource.clip = chargeSound;
		
				
		jumpEffects = GetComponentInChildren<JumpEffects>();



		shipCamera = gameObject.GetComponentInChildren<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();

		jumpEffects.setJumpEffectState(false);
		if(didWeWarpIn){
			restoreFov = true;
			shipCamera.setFovs(180.0f);
		}
		setFlatSpace(false);	//we arent in a gate or somewhere we can jump
		jumpBlocked = false;
	}
	
	
	public override void repair(float amount){
	}


	//force the ship to be in an area of flat spacetime
	public void setFlatSpace(bool state){

		if(state == true){
			removeRequirement("FLATSPACE");
		} else {
			addRequirement(new SystemRequirement("FLATSPACE", "not in area of smooth spacetime"));
		}
		updateJumpStatus();
	}
	
	public void go(){
		soundSource.Stop();
		soundSource.pitch = 1.0f;
		soundSource.clip = openSound;
		soundSource.Play();
		UsefulShit.PlayClipAt(initialisedSound, transform.position);
		jumpEffects.setJumpEffectState(true);

	}
	
	public void openSoundStart(){
		if(soundSource.isPlaying){
			return;
		}
		soundSource.pitch = 1.0f;
		soundSource.clip = openSound;
		soundSource.Play();
		
	}
	
	
	public void doJump(){
		
		
		disableSystem();
	}
	
	public override void enableSystem(){
		if(systemEnabled == false){
			systemEnabled = true;
			
			soundSource.loop = true;
			soundSource.clip = chargeSound;

			soundSource.Play();
			discharging = false;
			GetComponent<PropulsionSystem>().hyperspaceModifier = true;
		}
	}
	
	public override void disableSystem(){
		if(systemEnabled){
			//canJump = false;
			systemEnabled = false;
			//0jumpChargePercent = 0.0;
			//soundSource.Stop();
			discharging = true;
			//canJump = false;
			updateJumpStatus();
			GetComponent<PropulsionSystem>().hyperspaceModifier = false;
			if(jumping){
				jumpAbort();	//cancel the current sequence if someone turns the jump sys off while jumping
								//thanks to tgreer for this one
			}
		}
	}
	
	public void FixedUpdate() {
		if(systemEnabled){
				
			
			
				jumpChargePercent += (chargeRate * damage * powerState) / 100.0f;
				if(jumpChargePercent >= 1.0f){
					jumpChargePercent = 1.0f;
					//canJump = true;
					updateJumpStatus();

				} else {
					//canJump = false;
					updateJumpStatus();
				}
				soundSource.pitch = jumpChargePercent;
			
		} 
		if(discharging){
			jumpChargePercent -= 0.01f;
			soundSource.pitch = jumpChargePercent;
			if(jumpChargePercent <= 0){
				jumpChargePercent = 0.0f;
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
				CablePuzzleSystem cab = GetComponent<CablePuzzleSystem>();
				cab.puzzleStart();
			}
		}
	
	
		GetComponent<Rigidbody>().AddForce (transform.TransformDirection(Vector3.forward * 15000));
		
		float timeSinceJumpStart = Time.fixedTime - jumpStartTime;
		if(Mathf.FloorToInt (timeSinceJumpStart - Time.fixedDeltaTime ) != Mathf.FloorToInt (timeSinceJumpStart)){
			int ti = 5 - Mathf.FloorToInt(timeSinceJumpStart);
			StartCoroutine(GetComponent<DistanceSpeaker>().SpeakDistance((float)ti, 1, false));
		}
		if(timeSinceJumpStart > 2){	//turn on effects at 2 seconds	
			
			shipCamera.setFovs(85 + ((Time.fixedTime - jumpStartTime - 2) / 3.0f ) * 30);
		}
			
		//JUMP!
		if (timeSinceJumpStart  > 7	){	//jump at 7 seconds
			
			resetAfterJump();
			GameObject sceneScript  = GameObject.Find("SceneScripts");
			if(sceneScript != null){
				sceneScript.GetComponent<GenericScene>().LeaveScene();
			}
			
			Application.LoadLevel("hyper1");			
			UnityEngine.Debug.Log("JUMP!");
			
			
		} 
	}
	
	//restore fov after a jump - not used until i split the guilayer and game into seperate cameras
	if (restoreFov){
		shipCamera.setFovs( Mathf.Lerp(shipCamera.getFov(),85.0f,Time.deltaTime * 5.0f) );
		if (shipCamera.getFov() <= 85.1f){
			shipCamera.setFovs(85.0f);
			restoreFov = false;
			didWeWarpIn = false;

		}
		
	}
	
	}
	public void OnLevelWasLoaded(int level) {
		
	   	if(didWeWarpIn){
			resetAfterJump();

			jumpDest = ""; //players will have to plot again to escape
			jumpEffects.setJumpEffectState(false);
			shipCamera.setFovs(180.0f);
		}
	}   
	

	
	/* work out if we can actually jump or not and send that status to the clients
	*/
	public void updateJumpStatus(){

		
		OSCMessage msg = new OSCMessage("/ship/jumpStatus");	
		if(canShipJump() && jumpDest != ""){		
			msg.Append<int>(1);		
		} else {
			msg.Append<int>(0);
		}
		OSCHandler.Instance.SendMessageToAll(msg);
	}

	/* forcibly start the jump sequence, ignoring being in a gate or charged */
	public void forceJump(){

		go();
		jumpStartTime = Time.fixedTime;
		theShip.GetComponent<ShipCore>().setControlLock(true);
		jumping = true;
		GetComponent<Rigidbody>().drag = 0.05f;
		theShip.GetComponent<PropulsionSystem>().rotationDisabled  = true;
	}

	public bool canShipJump(){
		bool result = true;
		if(TargettingSystem.instance != null && TargettingSystem.instance.weaponState != WeaponState.WEAPON_STOWED){
			result = false;
		}
		if(jumpDest == ""){
			result = false;
		}
		// other requirements are handled by the requirements system stuff. landing gear and gravity well so far.
		if(canBeUsed() ==  false){
			result = false;
		}
		if(jumpChargePercent < 1f){
			result = false;
		}
		if (Reactor.instance != null && jumpLength * 400f > Reactor.instance.fuelTankLevel [0]) {
			result = false;
		}
		return result;
	}

	public string getFailureReason(){
		string noJumpReason = "Cannot jump\r\n";

		if(TargettingSystem.instance.weaponState != null && TargettingSystem.instance.weaponState != WeaponState.WEAPON_STOWED){
			noJumpReason += "> Retract Weapons Bays\r\n";
		}
		if(jumpDest == ""){
			noJumpReason += "> No Route Set\r\n";
		}
		// other requirements are handled by the requirements system stuff. landing gear and gravity well so far.
		if(canBeUsed() ==  false){
			noJumpReason += getRequirementString();
		}
		if(jumpChargePercent < 1f){
			noJumpReason += "> Jump System Not Charged\r\n";
		}

		if (jumpLength * 400f > Reactor.instance.fuelTankLevel [0]) {
			noJumpReason += "> INSUFFICIENT FUEL\r\n";
		}
		return noJumpReason;
	}
	/* Begin a jump sequence
	 * only works if we are inside a gate ring, the jump system reports its charged
	 * and we arent currently jumping (prevents idiots from spamming the jump button 
	*/
	public void startJump(){	//TODO replace these with systemrequirements
		bool shipCanJump = canShipJump();

		if(!shipCanJump){
			string noJumpReason = getFailureReason();
			//give the players the bad news
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Jump Error", noJumpReason, 3000);
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Jump Error", noJumpReason, 3000);
			OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "Jump Error", noJumpReason, 3000);
		}
		
		
		if(shipCanJump && !jumping){
			
			go();
			jumpStartTime = Time.fixedTime;
			theShip.GetComponent<ShipCore>().setControlLock(true);
			jumping = true;
			GetComponent<Rigidbody>().drag = 0.05f;
			theShip.GetComponent<PropulsionSystem>().rotationDisabled  = true;
			
			//test switching the consoles to hyperspace early
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace", true);
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace", true);
			
			CablePuzzleSystem cab = GetComponent<CablePuzzleSystem>();
			if(cab.isWaiting){
				cablePuzzleFailTimer = 1.0f;
			} 

			//consume all of the fuel
			int fuelAmount = jumpLength * 400;
			Reactor.instance.jumpFuel(fuelAmount);
			
			
		}
	}

	
	
	/* abort the jump, called if we smash into something during jumping
	*/
	public void jumpAbort(){
		soundSource.Stop();
		theShip.GetComponent<PropulsionSystem>().rotationDisabled  = false;
		theShip.GetComponent<ShipCore>().setControlLock(false);
		jumping = false;
		GetComponent<Rigidbody>().drag = 1.0f;
		restoreFov = true;
		jumpEffects.setJumpEffectState(false);
		OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
		GetComponent<PropulsionSystem>().hyperspaceModifier = false;
	}


	/* tidy up all of the jump effects
	*/
	public void resetAfterJump(){
		GetComponent<Rigidbody>().drag = 1.0f;
		theShip.GetComponent<ShipCore>().setControlLock(false);
		theShip.GetComponent<PropulsionSystem>().rotationDisabled  = false;
		jumping = false;
		restoreFov = true;
		GetComponent<PropulsionSystem>().hyperspaceModifier = false;
		doJump();
		
		
	}   
	
	
	
	
	
	
	
	public override void processOSCMessage(OSCMessage message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		
		if (operation == "state"){					//propulsion enable
				if ((int)message.Data[0] == 0){
					disableSystem();
				} else {
					enableSystem();
				}
		} else if(operation == "doJump"){
			startJump();
		} else if (operation ==  "startJump"){
			startJump();
		} else if (operation == "setRoute"){
			string r = (string)message.Data[0];	//TODO
			UnityEngine.Debug.Log("Set jump route : " + r);
			jumpDest = r;
			PersistentScene ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
			ps.hyperspaceDestination = jumpDest;
			jumpLength = (int)message.Data[1];
			updateJumpStatus();
		} else if (operation == "clearRoute"){
			UnityEngine.Debug.Log("Cleared jump route");
			jumpDest = "";
			jumpLength = 0;
			updateJumpStatus();
		} else if (operation == "getRoute"){
			OSCMessage msg = new OSCMessage("/system/jumpSystem/currentRoute");
			msg.Append(jumpDest);
			OSCHandler.Instance.SendMessageToAll(msg);
		} else if (operation == "whereAmI"){
			GenericScene g = GameObject.Find ("SceneScripts").GetComponent<GenericScene>();
			OSCMessage msg = new OSCMessage("/ship/state/currentLocationId");
			msg.Append(g.mapNodeId);

			OSCHandler.Instance.SendMessageToAll(msg);
		}
			
	}
}
