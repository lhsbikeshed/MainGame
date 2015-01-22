using UnityEngine;
using System;
using UnityOSC;

/* ship enters Scene
 * comet storm starts
 * ship takes a big hit and the cablepuzzle starts
 * lock the ships rotation to point at the large comet
 * wait for cable puzzle to complete
 * once complete trigger the code auth for emergency jump on engineer
 * configure jump system for emergency and continue to warzone scene
 */
[System.Serializable]
public class CometTunnelScene: GenericScene , CodeAuthSystem.AuthCodeListener {
	
	public Transform mainComet;
	public float distanceToDeath = 1000f;
	public Transform theShip;
	public Transform skyboxCamera;
	
	public CometRockSpawner rockSpawner;
	
	public CablePuzzleSystem cablePuzzleSystem;
	
	public CometTunnelScene.PuzzleState puzzleState = PuzzleState.STATE_ENTER;
	
	public AudioClip[] ambientPingNoises;
	float lastPingNoise = 0f;
	float nextPingNoise = 1f;
	
	bool inTunnel = false;
	bool tunnelExited = false;
	float exitPercentage =0.0f;
	bool jumpReady = false;
	
	
	public float minRangeForRocks = 7000f;
	public float maxRangeForRocks = 30000f;
	
	
	
	public override void Start() {
		skyboxCameraActive = true;
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
		cablePuzzleSystem = theShip.GetComponent<CablePuzzleSystem>();
		CodeAuthSystem.Instance.addListener(this);
		
		startScene();
		//lock the jump system with a requirement telling the players they need to clear the gravity well of the asteroid first
		JumpSystem.Instance.addRequirement(new SystemRequirement("GRAVITYWELL", "Large Gravity well detected"));
	}
	
	public void FixedUpdate() {
		//work out how far we are from the comet
		//trace a ray from the skyboxcamera to the main comet, take distance of first collision
		
		if(!inTunnel){
			calculateDistance();
			if(distanceToDeath < minRangeForRocks){
				rockSpawner.setRate(0f);	//turn off rocks close to the comet as they look shit
			} else {
				//scale the rate depending on distance
				float rate = UsefulShit.map(distanceToDeath, maxRangeForRocks, minRangeForRocks, 1.0f, 10.0f);
				rockSpawner.setRate(rate);
			}
		}
		
		if(puzzleState == PuzzleState.STATE_CABLE){
			doCableWait();
		} else if (puzzleState == PuzzleState.STATE_COMPLETE){
			waitForTunnelExit();
		}
		
		/* do random hull pinging noises */
		if(Time.fixedTime - lastPingNoise > nextPingNoise){
			lastPingNoise = Time.fixedTime;
			nextPingNoise = UsefulShit.map(distanceToDeath, minRangeForRocks, 0.0f, 3.0f, 1.0f);
			nextPingNoise += UnityEngine.Random.value * 2;
			AudioClip clip = ambientPingNoises[ UnityEngine.Random.Range(0, ambientPingNoises.Length) ];
			AudioSource tempAs = UsefulShit.PlayClipAt(clip, theShip.position + UnityEngine.Random.onUnitSphere * 5f);
			tempAs.pitch = UnityEngine.Random.Range(0.8f, 1.2f);
		}
		if(tunnelExited){
			exitPercentage = Mathf.Clamp(exitPercentage + 0.01f, 0.0f, 1.0f);		
			GameObject.Find("Directional light").GetComponent<Light>().intensity = 0.5f * exitPercentage;
			RenderSettings.ambientLight = new Color(0.72f, 0.72f, 0.72f) * exitPercentage;
		}
		
	}
	
	public void calculateDistance(){
		Vector3 startPos = Vector3.zero;
		bool inDetailSpace = mainComet.GetComponent<UniverseObject>().inDetailSpace;
		if(inDetailSpace){
			startPos = theShip.position;
		} else {
			startPos = skyboxCamera.position;
		}
		
		RaycastHit hit = new RaycastHit();
		Ray ray = new Ray(startPos, mainComet.position - startPos);
		bool collision = mainComet.GetComponentInChildren<Collider>().Raycast(ray, out hit, Mathf.Infinity);
		if(collision){
			distanceToDeath = hit.distance;
			if(inDetailSpace == false){
				distanceToDeath *= MapController._instance.iUniverseScale;
			}
		}
		
	}
	
	public void waitForTunnelExit(){
		if(tunnelExited && !jumpReady){
			jumpReady = true;
			//clear the gravity well requirement as we're now outside of it.
			JumpSystem.Instance.removeRequirement("GRAVITYWELL");
			
			//turn on the jump system and set it to IDGAF ABOUT ROUTES mode. This is a fucking hack.
			theShip.GetComponent<JumpSystem>().enableSystem();
			theShip.GetComponent<PropulsionSystem>().enableSystem();
			PersistentScene ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
			ps.hyperspaceDestination = 3;
			ps.forcedHyperspaceFail = false;	
			
			
			theShip.GetComponent<JumpSystem>().canJump = true;
			theShip.GetComponent<JumpSystem>().inGate = true;
			theShip.GetComponent<JumpSystem>().jumpDest = 3;	//set dest to warzone scene
			//i dont think this class should be responsible for this
			OSCMessage s1 = new OSCMessage("/ship/jumpStatus");
			s1.Append<int>(1);
			OSCHandler.Instance.SendMessageToAll(s1);
			
			//tell the players the gravity well has been cleared
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "SUCCESS", "Gravity well cleared\r\nEngage hyperspace system to resume course", 4000);
		}
		
		
	}
	
	public void enteredTunnel(){
		rockSpawner.gameObject.SetActive(false);
		mainComet.gameObject.SetActive(false);
		inTunnel = true;
		
	}
	
	public void tunnelComplete(){
		UnityEngine.Debug.Log("tunnel complete");
		puzzleComplete();
		inTunnel = false;
		mainComet.gameObject.SetActive(true);
		var tmp_cs1 = mainComet.position;
		tmp_cs1.z = 25698.77f;
		mainComet.position = tmp_cs1;
		
		tunnelExited = true;
	}
	
	
	
	/* wait for the cable puzzle to complete, once complete send out the auth screen stuff */
	public void doCableWait(){	
		if(cablePuzzleSystem.hasBeenCompleted){
			//show the emergency jump auth screen
			puzzleState = PuzzleState.STATE_CODE;
			CodeAuthSystem.Instance.startCodeRequest("EngineerStation", "EMERGENCY JUMP CODE", "62918", 100000.0f);
		}
	}
	
	/* code ok, prepare the ship for emergency jump
	* TODO: this is broken
	* ship should return to normal operation 
	* and then once outside of the tunnel spool up the jump system
	*/
	public void puzzleComplete(){
		Debug.Log ("scene received code ok");
		puzzleState = PuzzleState.STATE_COMPLETE;
		
		
	}
	
	public void startScene(){
		//turn off the propulsion system but allow translation
		theShip.GetComponent<PropulsionSystem>().disableSystem();
		theShip.GetComponent<PropulsionSystem>().translationDisabled = false;	
		theShip.rigidbody.drag = 0.5f;	
		//turn off jumpSystem	
		theShip.GetComponent<JumpSystem>().disableSystem();
		//play a failure sound effect of some sort
		
		cablePuzzleSystem.forceStart();
		puzzleState = PuzzleState.STATE_CABLE;
		
		//now set the pilot screen to use the collision avoidance system
		OSCHandler.Instance.RevertClientScreen("PilotStation", "cablepuzzle");
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "collisionradar", false);
	}
	
	public override void LeaveScene(){
		CodeAuthSystem.Instance.removeListener(this);
		CodeAuthSystem.Instance.stopCodeRequest("EngineerStation");
		
	}
	
	public void fireABastard(){
		rockSpawner.spawnInFrontOfPlayer();
	}
	
	
	
	public override void ProcessOSCMessage(OSCPacket msg){
		string[] msgAddress = msg.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		
		if(operation == "escape"){
			puzzleComplete();
			
		} else if (operation == "bastard"){
			fireABastard();
		}
		
		
	}
	
	public override void SendOSCMessage(){
		//send out a "distance to death" signal
		OSCMessage msg = new OSCMessage("/ship/state/altitude");
		msg.Append(distanceToDeath);
		OSCHandler.Instance.SendMessageToAll(msg);
		
	}
	
	/* send out osc messages for client screens */
	public override void configureClientScreens(){}
	
	//callbacks from code aith
	public void authCodeReturn(CodeAuthSystem.CodeState state){
		if(puzzleState == PuzzleState.STATE_CODE){
			UnityEngine.Debug.Log("auth code return state : " + state);
			if(state == CodeAuthSystem.CodeState.CODE_OK){
				
				//unlock the jump system and revert screens to normal					
				puzzleComplete();
				
			}
		}
	}
	
	public enum PuzzleState {
		STATE_ENTER = 0,
		STATE_CABLE = 1,
		STATE_CODE = 2,
		STATE_COMPLETE = 3,
		
	}
	
}
