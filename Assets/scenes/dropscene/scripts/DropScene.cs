using UnityEngine;
using System;
using UnityOSC;
using System.Collections;

[System.Serializable]
public class DropScene: GenericScene {

	
	public float altitude; //our altitude above planet
	float prevFrameAltitude;	//altitude at prev frame for counting
	public float maxAltitude; //start of altitude effects
	public float minAltitude; //Exposure to this altitude results in death
	
	public float maxShipSpinRate;	//max amount the ship to tumble
	
	public AudioClip explodeSound;
	public AudioClip windClip;
	
	public float rotateStrength = 1.0f;
	
	public float[] hulltemperature; //top/bottom/front/back/left/right
	Vector3[] hullDirections; //maps hull temps to directions
	public bool heating = true;
	
	public Vector3 diffVector ; //direction to fireball
	
	GameObject theShip; //the ship
	Transform planet; // planet reference
	Transform skyCam; //skybox camera
	Renderer fogball; //ball of fog around the ship
	ParticleSystem fireBall;	//fire particles
	AudioSource fireBallSound; //sound of the fireball
	Transform fireballObject;
	ParticleSystem dustBallObject;
	public Light fireballLight;
	
	float sceneEntryTime; //time we entered the scene
	
	public AudioClip warningLoop;
	public AudioClip altitudeWarning;
	public AudioClip jumpFail;
	AudioSource warningAudio; //general warning, this gets more frequent the lower down the ship gets
	float lastWarningTime;
	float warningTimer;
	
	bool playersFailed;
	bool weAreDying = false;
	float deathTime;
	
	GUITexture whiteOverlay;
	bool initialKick = true;
	
	//urgh
	public float airForce = 0.5f;
	
	//turbulence
	float lastTurbulence;
	float nextTurbulence;
	
	//ship refs
	JumpSystem jumpSystem;
	int jumpRoute  = -1;
	bool puzzleComplete = false;
	
	public override void Start() {

		sceneIsJumpInterruption = true;
		//get references
		planet = GameObject.Find("planet").transform;
		skyCam = GameObject.Find("skyboxCamera").transform;
		fogball = GameObject.Find("fogrenderer").GetComponent<Renderer>();
		fireballObject = GameObject.Find("atmosphereparticle").transform;
		fireBall = fireballObject.GetComponent<ParticleSystem>();
		fireBallSound = GameObject.Find("atmosphereparticle").GetComponent<AudioSource>();
		dustBallObject = GameObject.Find("dustparticle").GetComponent<ParticleSystem>();
		theShip = GameObject.Find("TheShip");
		jumpSystem = theShip.GetComponent<JumpSystem>();
		//we store this so that the players cant accidentally override it. if they do then we force it back
		//on the console. The ship will then emergency jump down the right route
		jumpRoute = 3;	//always jump to warzone after this scene
		
		hulltemperature = new float[6];
		hullDirections = new Vector3[6];
		hullDirections[0] = Vector3.up;
		hullDirections[1] = Vector3.down;
		hullDirections[2] = Vector3.left;
		hullDirections[3] = Vector3.right;
		hullDirections[4] = Vector3.forward;
		hullDirections[5] = Vector3.back;
		
		var tmp_cs1 = fogball.material.color;
        tmp_cs1.a = 0.0f;
        fogball.material.color = tmp_cs1;
		fireBall.startSize = 0.0f;
		
		
		//disable bits of ship we dont need
		// ship enters scene with fucked engines, add gravity and disable buggered systems.
		//add some drag otherwise we ping off into space
		GameObject.Find("Bits").active = false;
		theShip.GetComponent<Rigidbody>().useGravity = true;
		theShip.GetComponent<Rigidbody>().drag = 0.0f;
		
		//turn off the propulsion system but allow rotations
		theShip.GetComponent<PropulsionSystem>().disableSystem();
		theShip.GetComponent<PropulsionSystem>().rotationDisabled = false;
	
		//turn off jumpSystem	
		theShip.GetComponent<JumpSystem>().disableSystem();
		//theShip.rigidbody.drag = 0.5f;
	
		//add a little forward speed to the drop and add a roll rotation to show we came out of warp badly
		theShip.GetComponent<Rigidbody>().velocity = theShip.transform.rotation * Vector3.forward * 100;
		
		
		theShip.GetComponent<MiscSystem>().setExternalLight(false);	//ext light kills the planet shader
		theShip.GetComponent<MiscSystem>().consuming = false;			//disable o2 consumption as we cant raise its level while falling
																		//next scene is warp and will reenable at exit
		
		//audio
		warningAudio = gameObject.AddComponent<AudioSource>();
		warningAudio.clip = warningLoop;
		warningAudio.loop = false;
		warningAudio.dopplerLevel = 0.0f;
		warningTimer = 10.0f;
		
		whiteOverlay = GameObject.Find("whiteout").GetComponent<GUITexture>();
		
		weAreDying = false;
		
		
		altitude =  Vector3.Distance(planet.position, skyCam.position) * 10;
		prevFrameAltitude = altitude;
		
		AudioSource.PlayClipAtPoint(jumpFail, theShip.transform.position);
		
		//set up turbulence stuff
		lastTurbulence = Time.fixedTime + 3.0f;
		nextTurbulence = UnityEngine.Random.Range(5.0f, 15.0f);

		JumpSystem.Instance.addRequirement(new SystemRequirement("LOCKED", "Jump System Damaged - repatch power"));
		
	}
	
	public void updateFireballDirection(){
		diffVector = fireballObject.position - theShip.transform.position;
		diffVector = (Quaternion.Inverse(theShip.transform.rotation) * diffVector).normalized;
		
		
	}
	
	public void FixedUpdate(){
		//disable drag for now, not physically accurate but fuck it
		theShip.GetComponent<Rigidbody>().drag = 0.0f;
		//kick the ship slightly as we fail the exit
		if(initialKick){
			theShip.GetComponent<Rigidbody>().AddRelativeTorque(new Vector3(0.0f,0.0f,50.0f), ForceMode.Impulse);
			initialKick = false;
		}
		
		if(lastTurbulence + nextTurbulence < Time.fixedTime){
			lastTurbulence = Time.fixedTime;
			nextTurbulence = UnityEngine.Random.Range(8.0f, 20.0f);
			OSCHandler.Instance.SendMessageToAll(new OSCMessage("/scene/drop/turbulenceWarning"));
			Vector3 ranVec = UnityEngine.Random.onUnitSphere;
			ranVec.z = 0.0f;
			ranVec *= UnityEngine.Random.Range(300.0f, 650.0f);
			theShip.GetComponent<Rigidbody>().AddRelativeTorque(ranVec, ForceMode.Impulse);
		}
		
		
		//slowly rotate the ship toward the fireball
		theShip.GetComponent<Rigidbody>().AddTorque(Vector3.Cross(theShip.transform.forward, theShip.GetComponent<Rigidbody>().velocity.normalized) * airForce, ForceMode.Force);
		
		//check if the altitude has crossed a 1000/100 barrier and speak it out
		prevFrameAltitude = altitude;
		altitude =  Vector3.Distance(planet.position, skyCam.position) * 10;
		int pAlt = 0;
		int tAlt = 0;
		if(altitude < maxAltitude){
			pAlt =  Mathf.FloorToInt( ( prevFrameAltitude - minAltitude) / 1000.0f);
		 	tAlt = Mathf.FloorToInt((altitude - minAltitude) / 1000.0f);
			if( pAlt != tAlt ){
			//
				theShip.GetComponent<DistanceSpeaker>().SpeakDistance((float)(pAlt * 1000),1000);
			}
		
			//calculate ship spin
			float spin = map (altitude, maxAltitude, minAltitude, 0.0f ,maxShipSpinRate);
			
			//theShip.rigidbody.AddTorque(Vector3(0,spin,0));
			//calculate atmosphere bubble alpha
			float alpha = map(altitude, maxAltitude, minAltitude, 0.2f, 0.9f);
			
			var tmp_cs2 = fogball.material.color;
            tmp_cs2.a = alpha;
            fogball.material.color = tmp_cs2;
			if(altitude > 28000){
				//particle speed and size
				float speed = map(altitude, maxAltitude, minAltitude, 15.0f, 35.0f);
				fireBall.startSpeed = -speed;
				
				float size = map(altitude, maxAltitude, minAltitude, 0.0f, 20.0f);
				fireBall.startSize = size;
				
				fireBallSound.volume = map(altitude, maxAltitude, minAltitude, 0.5f, 1.0f);
				if(weAreDying){
					fireBallSound.volume -= 0.2f;
				}
				fireBallSound.pitch = map(altitude, maxAltitude, minAltitude, 0.2f, 1.0f);
				fireballLight.intensity = 2.0f + fireBallSound.pitch * 5.0f + UnityEngine.Random.Range(-1.0f, 1.0f);
			} else {
				pAlt =  Mathf.FloorToInt( ( prevFrameAltitude - minAltitude) / 100.0f);
			 	tAlt = Mathf.FloorToInt((altitude - minAltitude) / 100.0f);
				if( Mathf.FloorToInt(prevFrameAltitude / 100.0f) != Mathf.FloorToInt(altitude / 100.0f) ){
					theShip.GetComponent<DistanceSpeaker>().SpeakDistance((float)(pAlt * 100),100);
				}
				heating = false;
				if(fireBall.enableEmission == true){
					fireballLight.intensity = 0.0f;
					fireBall.enableEmission = false;
					fireBallSound.clip = windClip;
					fireBallSound.volume = 1.0f;
					fireBallSound.Play();
					
				}
			}
			
			//work out hull temps
			
			for(int i = 0 ; i < 6; i++){
				if(heating){
					float amt = Vector3.Dot(theShip.transform.rotation * hullDirections[i], theShip.GetComponent<Rigidbody>().velocity.normalized);
					hulltemperature[i] += amt / 10.0f;
					if(hulltemperature[i] < 10){
						hulltemperature[i] = 10.0f;
					}
					
					if(hulltemperature[i] > 300){
					//we died
						StartCoroutine(playerDied());
						
					}  
				} else {
					hulltemperature[i] -= 10.0f;
					if(hulltemperature[i] < 10){
						hulltemperature[i] = 10.0f;
					}
				}
			}
			//update radar directions
			updateFireballDirection();
			
			
			if(lastWarningTime + warningTimer < Time.fixedTime){
				lastWarningTime = Time.fixedTime;
				warningTimer = map(altitude, maxAltitude, minAltitude, 4.0f,2.0f);
				if(altitude < 28000){
					AudioSource.PlayClipAtPoint(altitudeWarning, theShip.transform.position);
				} else {
					AudioSource.PlayClipAtPoint(warningLoop, theShip.transform.position);
				}
				if(UnityEngine.Random.Range(0,100) < 15){
					StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(0.0f, "Hull Smashed By Atmosphere"));
			}	}
			
		} else {
			var tmp_cs3 = fogball.material.color;
            tmp_cs3.a = 0.0f;
            fogball.material.color = tmp_cs3;
			fireBall.startSize = 0.0f;
			fireBallSound.volume  =0.0f;
			fireBallSound.pitch = 0.2f;
		}
		
		if(altitude < minAltitude){
			//OH FUCK
			hitPlanet();
		}
		
		//fix possible jump route overwrites
		//if the players manage to reset the route then force it to the one we had when starting the scene
//		if(puzzleComplete && jumpSystem.jumpDest == ""){
//			//jumpSystem.jumpDest = "warzone-landing";	//force to warzone scene
//		
//			//jumpSystem.canJump = true;
//			jumpSystem.inGate = true;
//			JumpSystem.Instance.removeRequirement("LOCKED");
//			jumpSystem.updateJumpStatus();
//			
////			OSCMessage s1 = new OSCMessage("/ship/jumpStatus");
////			s1.Append<int>(jumpRoute);
////			OSCHandler.Instance.SendMessageToAll(s1);
//			
//		}
						
	}
	public void hitPlanet(){
		//silence all sounds, play a humongous crash and kill the players. Black out screen
		if(weAreDying == false){
			theShip.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.FreezeAll;	//freeze ship in place
		
			deathTime = Time.fixedTime;
			weAreDying = true;
			fireBallSound.volume = 0.0f;
			//var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			//ps.shipDead("Crashed into planet");
			StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(1000.0f, "Smeared across surface of a dust planet"));
		}
	}
		
	public IEnumerator playerDied(){
		if(weAreDying == false){
			deathTime = Time.fixedTime;
			weAreDying = true;
			
			
			OSCHandler.Instance.SendMessageToAll(new OSCMessage("/scene/drop/structuralFailure"));
		
			AudioSource.PlayClipAtPoint(explodeSound, theShip.transform.position);
			
			yield return new WaitForSeconds(16.0f);
			StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(1000.0f, "Burnt by the fires of unplanned re-entry"));
			//yield.WaitForSeconds(2);
		
			//var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			//ps.shipDead("Burnt by the fires of unplanned re-entry");
			
			
		}
	}
	void puzzleCompleted(){
		theShip.GetComponent<PropulsionSystem>().enableSystem();		
		
		//theShip.GetComponent<JumpSystem>().canJump = true;
		JumpSystem.Instance.removeRequirement("FLATSPACE");
		JumpSystem.Instance.removeRequirement("LOCKED");
		jumpSystem.updateJumpStatus();
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "drop");		
		OSCHandler.Instance.RevertClientScreen("EngineerStation", "drop");		
		
		puzzleComplete = true;
	}
	
	public override void Update() {
		if(weAreDying && Time.fixedTime - deathTime > 14.7f){
			var tmp_cs4 = whiteOverlay.color;
            tmp_cs4.a = Mathf.Lerp(0.0f, 1.00f, (Time.fixedTime - deathTime) / 3.3f);
            whiteOverlay.color = tmp_cs4;
		}
	
	
	}
	
	public float map(float x,float in_min,float in_max,float out_min,float out_max)
	{
	  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	
	
	//OSC HANDLERS
	public override void ProcessOSCMessage(OSCPacket message){
		string[] msgAddress = message.Address.Split(separator);
		
		string operation = msgAddress.Length >= 3 ? msgAddress[3] : "" + 0;
		
		switch(operation){
			
			
			case "droppanelrepaired":
				//drop scene equipment has been repaired, so turn on propulsion and jump, set jump coords
				//to next scene and set ship to allow jump
				
				if((int)message.Data[0] == 1){		//panel hardware was repaired but not auth
					OSCMessage s = new OSCMessage("/scene/drop/panelRepaired");
					
					OSCHandler.Instance.SendMessageToAll(s);
				
				} else if ((int)message.Data[0] == 2){
	
					puzzleCompleted();
					
				}
				
				break;
		}
	}
			
			


	public override void LeaveScene(){
		OSCHandler.Instance.RevertClientScreen("PilotStation", "drop");			
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "drop");		
		OSCHandler.Instance.RevertClientScreen("EngineerStation", "drop");			
	}
	
	public override void SendOSCMessage(){
		
		OSCMessage msg = new OSCMessage("/scene/drop/statupdate");
		msg.Append<float>(altitude - minAltitude);
		for(int i = 0; i < 6; i++){
			msg.Append<float>(hulltemperature[i]);
		}
				
		msg.Append<float>(diffVector.x);
		msg.Append<float>(diffVector.y);
		msg.Append<float>(diffVector.z);
		OSCHandler.Instance.SendMessageToAll(msg);
		
		msg = new OSCMessage("/ship/state/altitude");
		msg.Append<float>(altitude - minAltitude);
		OSCHandler.Instance.SendMessageToAll(msg);
	
	
	}
	
	public override void configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "drop", true);			
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "drop", true);		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "drop", true);			
	
	}
	
	
}
