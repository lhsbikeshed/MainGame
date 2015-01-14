using UnityEngine;
using System;
using UnityOSC;
[System.Serializable]
public class JumpSystem: BaseSubsystem
{

	public float jumpChargePercent;	//0->1 of how charged system is
	public float chargeRate;			//to tweak jump charge rates
	//var jumpRoute : int = -1 ;		//-1 = no route set, other values determine the "route" to take on the printed maps. Currently only 0 is used (mars drop)
									
									
									
									
	ParticleSystem jumpEffect;

	AudioSource soundSource;
	public AudioClip chargeSound;
	public AudioClip openSound;
	public AudioClip initialisedSound;
	bool discharging = false;
	//JUMP STUFF

	public bool didWeWarpIn;	//did we jump into this scene?
	public bool canJump;		//are we allowed to jump? Used by Jump Node
	public bool inGate;		//are we in a gate
	public bool inTunnelGate; //are we in a tunnel gate?
	public int jumpDest;	//where we jump to after the hyperspace scene is finished
	
	public bool jumping;			//are we currently accelerating for a jump?
	float jumpStartTime;		//time we started the jump, jump sequence lasts 7 seconds
	bool restoreFov;			//when a jump is aborted we need to restore fov

	float cablePuzzleFailTimer = 0.0f;
	ShipCamera shipCamera;
	Transform theCamera;
	
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
		
				
		theCamera = GameObject.Find("camera").transform;

		jumpEffect = transform.Find("JumpEffects").GetComponent<ParticleSystem>();
			shipCamera = gameObject.GetComponentInChildren<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();

		setJumpEffectState(false);
		if(didWeWarpIn){
			restoreFov = true;
			shipCamera.setFovs(180.0f);
		}
		
		jumpBlocked = false;
	}
	
	
	public override void repair(float amount){
	}
	
	public void go(){
		soundSource.Stop();
		soundSource.pitch = 1.0f;
		soundSource.clip = openSound;
		soundSource.Play();
		AudioSource.PlayClipAtPoint(initialisedSound, transform.position);
	
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
			canJump = false;
			systemEnabled = false;
			//0jumpChargePercent = 0.0;
			//soundSource.Stop();
			discharging = true;
			canJump = false;
			updateJumpStatus();
			GetComponent<PropulsionSystem>().hyperspaceModifier = false;
		}
	}
	
	public void FixedUpdate() {
		if(systemEnabled){
				
			
			
				jumpChargePercent += (chargeRate * damage * powerState) / 100.0f;
				if(jumpChargePercent >= 1.0f){
					jumpChargePercent = 1.0f;
					canJump = true;
					updateJumpStatus();

				} else {
					canJump = false;
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
	
	
		rigidbody.AddForce (transform.TransformDirection(Vector3.forward * 15000));
		
		float timeSinceJumpStart = Time.fixedTime - jumpStartTime;
		if(Mathf.FloorToInt (timeSinceJumpStart - Time.fixedDeltaTime ) != Mathf.FloorToInt (timeSinceJumpStart)){
			int ti = 5 - Mathf.FloorToInt(timeSinceJumpStart);
			StartCoroutine(GetComponent<DistanceSpeaker>().SpeakDistance((float)ti, 1, false));
		}
		if(timeSinceJumpStart > 2){	//turn on effects at 2 seconds
			
			setJumpEffectState(true);
			shipCamera.setFovs(85 + ((Time.fixedTime - jumpStartTime - 2) / 3.0f ) * 30);
		}
			
		//JUMP!
		if (timeSinceJumpStart  > 5){	//jump at 7 seconds
			
			resetAfterJump();
			GameObject sceneScript  = GameObject.Find("SceneScripts");
			if(sceneScript != null){
				sceneScript.GetComponent<GenericScene>().LeaveScene();
			}
			
			Application.LoadLevel(1);			
			UnityEngine.Debug.Log("JUMP!");
			
			
		} 
	}
	
	//restore fov after a jump - not used until i split the guilayer and game into seperate cameras
	if (restoreFov){
		shipCamera.setFovs( Mathf.Lerp(theCamera.camera.fieldOfView,85.0f,Time.deltaTime * 5.0f) );
		if (theCamera.camera.fieldOfView <= 85.0f){
			shipCamera.setFovs(85.0f);
			restoreFov = false;
		}
		
	}
	
	}
	public void OnLevelWasLoaded(int level) {
		
	   	if(didWeWarpIn){
			resetAfterJump();
			jumpDest = -1; //players will have to plot again to escape
			setJumpEffectState(false);
			didWeWarpIn = false;
			shipCamera.setFovs(180.0f);
		}
	}   
	
	public void setJumpEffectState(bool state){
		
		if(jumpEffect == null){
			jumpEffect = transform.Find("JumpEffects").GetComponent<ParticleSystem>();
		}
		if(state){
			jumpEffect.enableEmission = true;
		} else {
			jumpEffect.enableEmission = false;
		}
	}
	
	/* work out if we can actually jump or not and send that status to the clients
	*/
	public void updateJumpStatus(){

		
		OSCMessage msg = new OSCMessage("/ship/jumpStatus");	
		if(inGate && canJump && jumpDest >= 0){		
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
		rigidbody.drag = 0.05f;
		theShip.GetComponent<PropulsionSystem>().rotationDisabled  = true;
	}

	/* Begin a jump sequence
	 * only works if we are inside a gate ring, the jump system reports its charged
	 * and we arent currently jumping (prevents idiots from spamming the jump button 
	*/
	public void startJump(){	//TODO replace these with systemrequirements
		string noJumpReason = "Cannot jump\r\n";
		bool jumpFail = false;
		
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
			theShip.GetComponent<ShipCore>().setControlLock(true);
			jumping = true;
			rigidbody.drag = 0.05f;
			theShip.GetComponent<PropulsionSystem>().rotationDisabled  = true;
			
			//test switching the consoles to hyperspace early
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace", true);
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace", true);
			
			CablePuzzleSystem cab = GetComponent<CablePuzzleSystem>();
			if(cab.isWaiting){
				cablePuzzleFailTimer = 1.0f;
			} 
			
			
		}
	}

	
	
	/* abort the jump, called if we smash into something during jumping
	*/
	public void jumpAbort(){
		soundSource.Stop();
		theShip.GetComponent<PropulsionSystem>().rotationDisabled  = false;
		theShip.GetComponent<ShipCore>().setControlLock(false);
		jumping = false;
		rigidbody.drag = 1.0f;
		restoreFov = true;
		setJumpEffectState(false);
		OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
		GetComponent<PropulsionSystem>().hyperspaceModifier = false;
	}


	/* tidy up all of the jump effects
	*/
	public void resetAfterJump(){
		rigidbody.drag = 1.0f;
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
			int r = (int)message.Data[0];
			UnityEngine.Debug.Log("Set jump route : " + r);
			jumpDest = r;
			PersistentScene ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
			ps.hyperspaceDestination = jumpDest;
			
			updateJumpStatus();
		} else if (operation == "clearRoute"){
			UnityEngine.Debug.Log("Cleared jump route");
			jumpDest = -1;
			updateJumpStatus();
		}
			
			
	}
}
