using UnityEngine;
using System;
using UnityOSC;
using System.Collections;


public class ShipCore:MonoBehaviour{
	
	Transform ship;
	public static ShipCore instance;
	
	public bool docked;
	public AudioClip clampSFX;		//clamp releatheCse effect
	
	
	int weaponsPower = 6;
	int sensorPower = 6;
	int internalPower = 6;
	int propulsionPower = 6;
	
	public bool freezable = false;
	
	public float hullState = 100.0f;
	public Vector3 acceleration;
	Vector3 lastVelocity;
	float previousHullState = 100.0f;
	
	
	public AudioClip[] crashSounds;
	public AudioClip[] explosionSfx;
	public bool exploding = false;
	
	public Transform explosionPrefab; //spawn these around ship during explode();
	float lastExplosion;
	float nextExplosion;
	
	float lastExplosionSfxTime ;
	float nextExplosionSfxTime;
	
	float lastSparkTime;
	float nextSparkTime;
	
	
	
	
	
	// location in sector map
	Vector3 sectorPosition;
	
	
	//effects!
	
	ParticleSystem moveEffects;
	DoorScript shutterScript;
	FrontWindowBehaviour windowScript;
	Transform canopyObject;
	ShipCamera shipCamera;
	UndercarriageBehaviour undercarriage;
	public ShipsLaser laserTurret;

	IceEffect iceEffect;
	
	
	
	
	float throttleDisableTime;
	
	
	//components
	Transform theCamera;
	
	//subsystems
	Reactor reactor;
	PropulsionSystem propulsion;
	
	JumpSystem jumpSystem;
	MiscSystem miscSystem;
	
	//sound
	AudioSource externalSFX;
	public AudioSource hullBreachSFX;
	
	
	bool controlsLocked;	//locked controls? (for autopilot or jumps)	
	//states n stuff
	bool dockingChange = false;
	
	float lastNetworkTime = 0.0f;
	
	/*
	 * Ship systems
	 * eventually this will listen for OSC messages from clients as well
	 * as broadcast its own messages
	 * this will also simulate ship systems such as shields, reactor stuff and damage 
	 
	 * ideas:
	 * have two engines, if one is damaged then constantly pull to one side (rotate the addpos vector a little)
	 
	 */
	public void Start() {
		instance = this;
		ship = GameObject.Find("TheShip").transform;
		laserTurret = GetComponentInChildren<ShipsLaser>();
		theCamera = ship.Find("camera");
		throttleDisableTime = 0.0f;
		controlsLocked = false;
		
		
		//get subsystem refs
		reactor = GetComponent<Reactor>();
		propulsion = GetComponent<PropulsionSystem>();
		jumpSystem = GetComponent<JumpSystem>();
		shipCamera = gameObject.GetComponentInChildren<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();
		undercarriage = GetComponentInChildren<UndercarriageBehaviour>();
		miscSystem = GetComponent<MiscSystem>();


		
		//effects refs
		moveEffects = transform.Find("Bits").GetComponent<ParticleSystem>();
		moveEffects.emissionRate = 0.0f;
	
		iceEffect = GetComponentInChildren<IceEffect> ();
		iceEffect.freezeAmount = 0.0f;

		windowScript = GetComponentInChildren<FrontWindowBehaviour>();
		shutterScript = gameObject.GetComponentInChildren<DoorScript>();
		
		
		externalSFX = gameObject.AddComponent<AudioSource>();
		
	}
	
	
	// prevent this object from dying between scene transitions
	public void Awake(){
		DontDestroyOnLoad(transform);
	}
	
	
	/* bring the front shutter up and down */
	public void setShutterState(bool state){
		if(state == true){
			shutterScript.openDoor();
		} else {
			shutterScript.closeDoor();
		}
	
	}
	
	public void OnCollisionEnter(Collision c){
	
		bool onFoot = false;
		foreach(ContactPoint cp in c.contacts){
			Vector3 relativePosition = transform.InverseTransformPoint(cp.point);
	
	    	if (relativePosition.z > 0) {
			
				if(c.impactForceSum.magnitude > 50 && shutterScript.state != DoorScript.DoorState.CLOSED){
					//damage the window
					windowScript.hitSomething(c.impactForceSum.magnitude);
				}
			}
			//just check that the collision wasnt on the foot, we dont make crunch sounds if it is
			if(cp.thisCollider.name == "Foot"){
				onFoot = true;
			}
				
		}
		
		if(!docked ){
			//if we hit some debris check we didnt hit it already, prevents damage spamming
			if(c.transform.name.Contains("debris")){
			
				debrisbehaviour d = c.transform.GetComponent<debrisbehaviour>();
				if(d.hitShip == false){		
					AudioSource.PlayClipAtPoint( crashSounds[UnityEngine.Random.Range(0, crashSounds.Length)], transform.position);
					OSCMessage msg = new OSCMessage("/ship/collision");		
					OSCHandler.Instance.SendMessageToAll(msg);
					StartCoroutine(damageShip((float)UnityEngine.Random.Range(10,15), "Smashed by starship debris"));
					d.hitShip = true;
				}
			} else {
			
				AudioSource.PlayClipAtPoint( crashSounds[UnityEngine.Random.Range(0, crashSounds.Length)], transform.position);
				float damage = c.impactForceSum.magnitude;
				if(damage > 50){
					damage *= .005f;
					if(!onFoot){ StartCoroutine(damageShip(damage, "Smashed the outer hull open")); };
					UnityEngine.Debug.Log("dam: " + damage);
				}
			}
			
		}
		
		throttleDisableTime = Time.fixedTime;
		
		//cancel the jump sequence if we clomp something
		if(jumpSystem.jumping){
			jumpSystem.jumpAbort();
		}
		
		
		
	}

	
	/* damage the ship, give an amount and reason. If the ship dies during this damage then the consoles will
	 * display the reason 
	 */
	public IEnumerator damageShip(float amount,string deathText){
		OSCMessage msg = new OSCMessage("/ship/damage");	
		
		msg.Append<float>(amount);		
		
		OSCHandler.Instance.SendMessageToAll(msg);
		GetComponentInChildren<ShipCamera>().shakeFor(1.0f);
		changeHullLevel(-amount);
		if(hullState <= 0){
		
			//trigger explosion etc etc
			hullState = 0.0f;
			Explode();
			GetComponent<ExplosionOverlayBehaviour>().die();
			yield return new WaitForSeconds(4.0f) ;
			//silence all of the subsystems
			
			foreach(AudioSource s in GetComponentsInChildren<AudioSource>()){
				s.Stop();
			}
			GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().shipDead(deathText);
			
			
	
		}
		CabinEffects.Instance().CabinSpark();
		
		
		//randomly pop the flap open
		if(amount > 8.0f && UnityEngine.Random.Range(0,100) < 20.0f){
			msg = new OSCMessage("/ship/effect/openFlap");			
			OSCHandler.Instance.SendMessageToAll(msg);
		}
		
	//	var cab : CablePuzzleSystem = GetComponent.<CablePuzzleSystem>();
	//	if(cab.isWaiting){
	//		cab.puzzleStart();
	//	} 
		
		reactor.damageReactor(amount);
		
	}
	
	public void changeHullLevel(float amount){
		//slowly repair the hull
		previousHullState = hullState;
		hullState += amount;
		hullState = Mathf.Clamp(hullState, 0, 100);
		if(hullState <= 15.0f && previousHullState > 15.0f){
			//we crossed into red alert territory
			CabinEffects.Instance().setRedAlert(true);
		} else if (hullState > 15.0f && previousHullState <= 15.0f){
			CabinEffects.Instance().setRedAlert(false);
		}
		
	}
	
	
	
	/* lock out pilot controls */
	public void setControlLock(bool state){
		controlsLocked = !state;
	}
	
	 
	
	
	/* -------------- Persistence ------------ 
	 * check to see if there is a "jumpexit" and align the ship with it if there is
	 * if the scene loads and we were in warp then end the jump and reset all of the jump stuff
	*/
	  
	public void OnLevelWasLoaded(int level) {
		//find the local jump Exit point and put ourselves there
		GameObject exitPoint = GameObject.Find("JumpExit");
	   	if(exitPoint != null){
	   		transform.position = exitPoint.transform.position;
	   		transform.rotation = exitPoint.transform.rotation;
	   		float speed = 0.0f;
	   		speed = GetComponent<Rigidbody>().velocity.magnitude;
	   		GetComponent<Rigidbody>().velocity = (exitPoint.transform.rotation * Vector3.forward) * speed;
	   		 
	   		UnityEngine.Debug.Log("Found exit node.." + exitPoint.transform.position);
	   		
	   	} else {
	   		if(Application.loadedLevel != 0){
	   			transform.position = new Vector3(0.0f,0.0f,0.0f);
	   		}
	   	}
	   
	}   
	
	
	/* Release docking clamp
	*/
	public void releaseClamp(){
		if (docked && dockingChange == false){
			dockingChange = true;
			externalSFX.clip = clampSFX;
			externalSFX.Play();
			//yield WaitForSeconds(2.5);
			docked = false;
			//controlsLocked = false;
			//transform.parent = null;
			dockingChange = false;
			GetComponent<Rigidbody>().constraints = RigidbodyConstraints.None;
			miscSystem.consuming = true;
			OSCMessage msg = new OSCMessage("/system/misc/clampState");
			msg.Append<int>(0);
			OSCHandler.Instance.SendMessageToAll(msg);
			GetComponent<Rigidbody>().AddRelativeForce(Vector3.down * 30.0f, ForceMode.Impulse);
			GetComponent<Rigidbody>().AddRelativeTorque(Vector3.forward * UnityEngine.Random.Range(-10.0f, 10.0f), ForceMode.Impulse);
		}
		
		
	}
	
	/* Permanently stick the ship in place, only works if all four feet are in contact with floor*/
	public IEnumerator enableClamp(){
		if (!docked && dockingChange == false ){
			dockingChange = true;
			externalSFX.clip = clampSFX;
			externalSFX.Play();
			yield return new WaitForSeconds(2.5f);
			docked = true;
			//controlsLocked = false;
			//transform.parent = null;
			dockingChange = false;
			GetComponent<Rigidbody>().constraints = RigidbodyConstraints.FreezeAll;
			miscSystem.consuming = false;
			OSCMessage msg = new OSCMessage("/system/misc/clampState");
			msg.Append<int>(1);
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	
	/* -------------- power handling --------------- */
	public int getWeaponsPower() {
		return weaponsPower;
	}
	
	public void setWeaponsPower(int p){
		p = Mathf.Clamp(p, 0, 12);
		weaponsPower = p;
		sendPowerLevelUpdate();
		
	}
	
	public int getInternalPower() {
		return internalPower;
	}
	
	public void setInternalPower(int p){
		p = Mathf.Clamp(p, 0, 12);
		internalPower = p;
		sendPowerLevelUpdate();
	}
	
	public int getPropulsionPower() {
		return propulsionPower;
	}
	
	public void setPropulsionPower(int p){
		p = Mathf.Clamp(p, 0, 12);
		propulsionPower = p;
		sendPowerLevelUpdate();
	}
	
	public int getSensorPower() {
		return sensorPower;
	}
	
	public void setSensorPower(int p){
		p = Mathf.Clamp(p, 0, 12);
		sensorPower = p;
		sendPowerLevelUpdate();
	}
	
	/*----------------- Updates --------*/
	   
	public void FixedUpdate(){
	
		//update the acceleration public var, used for animations of various things
		acceleration = (GetComponent<Rigidbody>().velocity - lastVelocity) / Time.fixedDeltaTime;
		lastVelocity = GetComponent<Rigidbody>().velocity;
	
		//repair ship hull, 0.01f is max level, scale from 0-12 that internalpower provides
		if (reactor.systemEnabled) {
			float repairAmount = UsefulShit.map ((float)internalPower, 0.0f, 12.0f, 0.0f, 0.01f);
			changeHullLevel (repairAmount);
			reactor.repairReactor (repairAmount);

			if(iceEffect.freezeAmount > 0.0f){
				iceEffect.freezeAmount -= 0.1f;
			}

		} else {
			//freeze the ship
			if(freezable){
				iceEffect.freezeAmount += 0.01f * Time.fixedDeltaTime;
				if(iceEffect.freezeAmount >= 1.0f){
					GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().shipDead("Frozen to death in deep space");
				}

			}
		}
		
		//explode the ship
		if(exploding){
			if(lastExplosionSfxTime + nextExplosionSfxTime < Time.fixedTime){
				lastExplosionSfxTime = Time.fixedTime;
				nextExplosionSfxTime = UnityEngine.Random.Range(1,5) / 10.0f;
				AudioSource.PlayClipAtPoint(explosionSfx[Mathf.FloorToInt((float)UnityEngine.Random.Range(0, explosionSfx.Length) )], transform.position);
				Transform t = (UnityEngine.Transform)Instantiate(explosionPrefab, transform.position + UnityEngine.Random.onUnitSphere * 2.0f, Quaternion.identity);
				t.GetComponent<ParticleSystem>().Play();
			}
		
		}
		
		
		if(docked){
			if(propulsion.systemEnabled){
				shipCamera.shaking = true;
				shipCamera.shakeAmount = propulsion.scaledThrottle / 1.0f * 0.05f;
			}
		} else {
			shipCamera.shaking = false;
		}
		
			
		
		//sfx for movement
		moveEffects.emissionRate = GetComponent<Rigidbody>().velocity.magnitude / 10.0f;
		
		
		if(hullState < 20.0f){
			if(lastSparkTime + nextSparkTime < Time.fixedTime){
				lastSparkTime = Time.fixedTime;
				nextSparkTime = UnityEngine.Random.Range(2.0f, 6.0f);
				CabinEffects.Instance().CabinSpark();
			}
		}
		
	}
	
	
	//blow the ship up and surround with explosions
	public void Explode(){
		CabinEffects.Instance().setRedAlert(false);
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "failureScreen", true);
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "failureScreen", true);
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "failureScreen", true);
		exploding = true;
		for(int i = 0; i < Mathf.FloorToInt((float)UnityEngine.Random.Range(14,24)); i++){
			windowScript.spawnCrack((float)UnityEngine.Random.Range(100,300));
		}
	
	}
	
			 
	/* if we are in the docking chamber AND clamp is on then disable controls, if we entered the bay then parent the ship
	 * to the bay so that we inherit its rotation
	 */
	public void OnTriggerStay(Collider other){
		if(other.name == "DockChamber"){			//are we docked? if so lock controls are rotate to match the Dockchamber
			if(docked){
				controlsLocked = true;
			}
	
		}
	}
	
	
	
	public void OnTriggerExit(Collider other){

	}
	

	public void OnTriggerEnter(Collider other){

	}
	
	/* send out updated power levels to the clients */
	public void sendPowerLevelUpdate(){
		OSCMessage m = new OSCMessage("/system/ship/powerLevels");
		m.Append(propulsionPower);
		m.Append(internalPower);
		m.Append(sensorPower);
		m.Append(weaponsPower);
	
	
		OSCHandler.Instance.SendMessageToAll(m);
	}
	
	public void processOSCMessage(OSCPacket msg){
		
		string[] msgAddress = msg.Address.Split(new char[]{'/'});
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		
		if(operation == "getPowerLevels"){
			sendPowerLevelUpdate();
		}
	}



}
