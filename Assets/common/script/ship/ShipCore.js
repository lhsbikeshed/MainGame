#pragma strict

private var ship : Transform;
public static var instance : ShipCore;

var docked : boolean;
var clampSFX : AudioClip;		//clamp releatheCse effect


private var weaponsPower  : int = 6;
private var sensorPower : int = 6;
private var internalPower : int = 6;
private var propulsionPower : int = 6;



var hullState : float = 100.0f;
var acceleration : Vector3;
private var lastVelocity : Vector3;
private var previousHullState = 100.0f;


var crashSounds : AudioClip[];
var explosionSfx : AudioClip[];
var exploding : boolean = false;

var explosionPrefab : Transform; //spawn these around ship during explode();
private var lastExplosion: float;
private var nextExplosion : float;

private var lastExplosionSfxTime : float ;
private var nextExplosionSfxTime : float;

private var lastSparkTime : float;
private var nextSparkTime : float;





// location in sector map
private var sectorPosition : Vector3;


//effects!

private var moveEffects : ParticleSystem;
private var shutterScript : DoorScript;
private var windowScript : FrontWindowBehaviour;
private var canopyObject : Transform;
private var shipCamera : ShipCamera;
private var undercarriage : UndercarriageBehaviour;
var laserTurret : ShipsLaser;




private var throttleDisableTime : float;


//components
private var theCamera : Transform;

//subsystems
private var reactor : Reactor;
private var propulsion : PropulsionSystem;

private var jumpSystem : JumpSystem;
private var miscSystem : MiscSystem;

//sound
private var externalSFX : AudioSource;
var hullBreachSFX : AudioSource;


private var controlsLocked : boolean;	//locked controls? (for autopilot or jumps)	
//states n stuff
private var dockingChange : boolean = false;

private var lastNetworkTime : float = 0.0f;

/*
 * Ship systems
 * eventually this will listen for OSC messages from clients as well
 * as broadcast its own messages
 * this will also simulate ship systems such as shields, reactor stuff and damage 
 
 * ideas:
 * have two engines, if one is damaged then constantly pull to one side (rotate the addpos vector a little)
 
 */
function Start () {
	instance = this;
	ship = GameObject.Find("TheShip").transform;
	laserTurret = GetComponentInChildren(ShipsLaser);
	theCamera = ship.Find("camera");
	throttleDisableTime = 0.0f;
	controlsLocked = false;
	
	
	//get subsystem refs
	reactor = GetComponent.<Reactor>();
	propulsion = GetComponent.<PropulsionSystem>();
	jumpSystem = GetComponent.<JumpSystem>();
	shipCamera = gameObject.GetComponentInChildren.<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();
	undercarriage = GetComponentInChildren.<UndercarriageBehaviour>();
	miscSystem = GetComponent.<MiscSystem>();
	
	
	//effects refs
	moveEffects = transform.Find("Bits").GetComponent.<ParticleSystem>();
	moveEffects.emissionRate = 0.0f;

	windowScript = GetComponentInChildren(FrontWindowBehaviour);
	shutterScript = gameObject.GetComponentInChildren(DoorScript);
	
	
	externalSFX = gameObject.AddComponent("AudioSource");
	
}


// prevent this object from dying between scene transitions
function Awake(){
	DontDestroyOnLoad(transform);
}


/* bring the front shutter up and down */
function setShutterState(state : boolean){
	if(state == true){
		shutterScript.openDoor();
	} else {
		shutterScript.closeDoor();
	}

}

function OnCollisionEnter(c : Collision){

	var onFoot : boolean = false;
	for(var cp : ContactPoint in c.contacts){
		var relativePosition = transform.InverseTransformPoint(cp.point);

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
		
			var d : debrisbehaviour = c.transform.GetComponent.<debrisbehaviour>();
			if(d.hitShip == false){		
				AudioSource.PlayClipAtPoint( crashSounds[Random.Range(0, crashSounds.length)], transform.position);
				var msg : OSCMessage = OSCMessage("/ship/collision");		
				OSCHandler.Instance.SendMessageToAll(msg);
				damageShip(Random.Range(10,15), "Smashed by starship debris");
				d.hitShip = true;
			}
		} else {
		
			AudioSource.PlayClipAtPoint( crashSounds[Random.Range(0, crashSounds.length)], transform.position);
			var damage : float = c.impactForceSum.magnitude;
			if(damage > 50){
				damage *= .005;
				if(!onFoot){ damageShip(damage, "Smashed the outer hull open"); };
				Debug.Log("dam: " + damage);
			}
		}
		
	}
	
	throttleDisableTime = Time.fixedTime;
	
	//cancel the jump sequence if we clomp something
	if(jumpSystem.jumping){
		jumpSystem.jumpAbort();
	}
	
	
	
}


function Update()
{

	 
}


/* damage the ship, give an amount and reason. If the ship dies during this damage then the consoles will
 * display the reason 
 */
function damageShip(amount : float, deathText : String){
	var msg : OSCMessage = OSCMessage("/ship/damage");	
	
	msg.Append.<float>(amount);		
	
	OSCHandler.Instance.SendMessageToAll(msg);
	GetComponentInChildren.<ShipCamera>().shakeFor(1.0);
	changeHullLevel(-amount);
	if(hullState <= 0){
	
		//trigger explosion etc etc
		hullState = 0;
		Explode();
		GetComponent.<ExplosionOverlayBehaviour>().die();
		yield WaitForSeconds(4) ;
		//silence all of the subsystems
		
		for (var s : AudioSource in GetComponentsInChildren.<AudioSource>()){
			s.Stop();
		}
		GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead(deathText);
		
		

	}
	CabinEffects.Instance().CabinSpark();
	
	
	//randomly pop the flap open
	if(amount > 8.0f && Random.Range(0,100) < 20.0f){
		msg = OSCMessage("/ship/effect/openFlap");			
		OSCHandler.Instance.SendMessageToAll(msg);
	}
	
//	var cab : CablePuzzleSystem = GetComponent.<CablePuzzleSystem>();
//	if(cab.isWaiting){
//		cab.puzzleStart();
//	} 
	
	reactor.damageReactor();
	
}

function changeHullLevel(amount : float){
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
function setControlLock(state : boolean){
	controlsLocked = !state;
}

 


/* -------------- Persistence ------------ 
 * check to see if there is a "jumpexit" and align the ship with it if there is
 * if the scene loads and we were in warp then end the jump and reset all of the jump stuff
*/
  
function OnLevelWasLoaded (level : int) {
	//find the local jump Exit point and put ourselves there
	var exitPoint : GameObject = GameObject.Find("JumpExit");
   	if(exitPoint != null){
   		transform.position = exitPoint.transform.position;
   		transform.rotation = exitPoint.transform.rotation;
   		var speed : float;
   		speed = rigidbody.velocity.magnitude;
   		rigidbody.velocity = (exitPoint.transform.rotation * Vector3.forward) * speed;
   		 
   		Debug.Log("Found exit node.." + exitPoint.transform.position);
   		
   	} else {
   		if(Application.loadedLevel!=0){
   			transform.position = Vector3(0,0,0);
   		}
   	}
   
}   


/* Release docking clamp
*/
function releaseClamp(){
	if (docked && dockingChange == false){
		dockingChange = true;
		externalSFX.clip = clampSFX;
		externalSFX.Play();
		//yield WaitForSeconds(2.5);
		docked = false;
		//controlsLocked = false;
		//transform.parent = null;
		dockingChange = false;
		rigidbody.constraints = RigidbodyConstraints.None;
		miscSystem.consuming = true;
		var msg : OSCMessage = OSCMessage("/system/misc/clampState");
		msg.Append.<int>(0);
		OSCHandler.Instance.SendMessageToAll(msg);
		rigidbody.AddRelativeForce(Vector3.down * 30.0f, ForceMode.Impulse);
		rigidbody.AddRelativeTorque(Vector3.forward * Random.Range(-10.0f, 10.0f), ForceMode.Impulse);
	}
	
	
}

/* Permanently stick the ship in place, only works if all four feet are in contact with floor*/
function enableClamp(){
	if (!docked && dockingChange == false ){
		dockingChange = true;
		externalSFX.clip = clampSFX;
		externalSFX.Play();
		yield WaitForSeconds(2.5);
		docked = true;
		//controlsLocked = false;
		//transform.parent = null;
		dockingChange = false;
		rigidbody.constraints = RigidbodyConstraints.FreezeAll;
		miscSystem.consuming = false;
		var msg : OSCMessage = OSCMessage("/system/misc/clampState");
		msg.Append.<int>(1);
		OSCHandler.Instance.SendMessageToAll(msg);
	}
}


/* -------------- power handling --------------- */
function getWeaponsPower() : int {
	return weaponsPower;
}

function setWeaponsPower(p : int){
	p = Mathf.Clamp(p, 0, 12);
	weaponsPower = p;
	sendPowerLevelUpdate();
	
}

function getInternalPower() : int {
	return internalPower;
}

function setInternalPower(p : int){
	p = Mathf.Clamp(p, 0, 12);
	internalPower = p;
	sendPowerLevelUpdate();
}

function getPropulsionPower() : int {
	return propulsionPower;
}

function setPropulsionPower(p : int){
	p = Mathf.Clamp(p, 0, 12);
	propulsionPower = p;
	sendPowerLevelUpdate();
}

function getSensorPower() : int {
	return sensorPower;
}

function setSensorPower(p : int){
	p = Mathf.Clamp(p, 0, 12);
	sensorPower = p;
	sendPowerLevelUpdate();
}

/*----------------- Updates --------*/
   
function FixedUpdate(){

	//update the acceleration public var, used for animations of various things
	acceleration = (rigidbody.velocity - lastVelocity) / Time.fixedDeltaTime;
	lastVelocity = rigidbody.velocity;

	//repair ship hull, 0.01f is max level, scale from 0-12 that internalpower provides
	if(reactor.systemEnabled){
		var repairAmount : float = UsefulShit.map(internalPower, 0, 12, 0, 0.01f);
		changeHullLevel(repairAmount);
		reactor.repairReactor(repairAmount);
		
	}
	
	//explode the ship
	if(exploding){
		if(lastExplosionSfxTime + nextExplosionSfxTime < Time.fixedTime){
			lastExplosionSfxTime = Time.fixedTime;
			nextExplosionSfxTime = Random.Range(1,5) / 10.0f;
			AudioSource.PlayClipAtPoint(explosionSfx[Mathf.FloorToInt(Random.Range(0, explosionSfx.length) )], transform.position);
			var t : Transform = Instantiate(explosionPrefab, transform.position + Random.onUnitSphere * 2.0f, Quaternion.identity);
			t.particleSystem.Play();
		}
	
	}
	
	
	if(docked){
		shipCamera.shaking = true;
		shipCamera.shakeAmount = propulsion.scaledThrottle / 1.0 * 0.05;
	} else {
		shipCamera.shaking = false;
	}
	
		
	
	//sfx for movement
	moveEffects.emissionRate = rigidbody.velocity.magnitude / 10.0f;
	
	
	if(hullState < 20.0f){
		if(lastSparkTime + nextSparkTime < Time.fixedTime){
			lastSparkTime = Time.fixedTime;
			nextSparkTime = Random.Range(2.0, 6.0);
			CabinEffects.Instance().CabinSpark();
		}
	}
	
}


//blow the ship up and surround with explosions
function Explode(){
	CabinEffects.Instance().setRedAlert(false);
	
	OSCHandler.Instance.ChangeClientScreen("PilotStation", "failureScreen", true);
	OSCHandler.Instance.ChangeClientScreen("EngineerStation", "failureScreen", true);
	OSCHandler.Instance.ChangeClientScreen("TacticalStation", "failureScreen", true);
	exploding = true;
	for(var i = 0; i < Mathf.FloorToInt(Random.Range(14,24)); i++){
		windowScript.spawnCrack(Random.Range(100,300));
	}

}

		 
/* if we are in the docking chamber AND clamp is on then disable controls, if we entered the bay then parent the ship
 * to the bay so that we inherit its rotation
 */
function OnTriggerStay(other : Collider){
	if(other.name == "DockChamber"){			//are we docked? if so lock controls are rotate to match the Dockchamber
		if(docked){
			controlsLocked = true;
		}

	}
}



/* enable the pilots radar on leaving the bay. Also unparent from bay so that the ship rotates freely
*/
function OnTriggerExit(other : Collider){
	if(other.name == "DockChamber"){		
		//transform.parent = null;
		var msg : OSCMessage = OSCMessage("/scene/launchland/launchRadar");
		msg.Append.<int>(1);
		
		OSCHandler.Instance.SendMessageToAll(msg);
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");	//switch pilot to radar
		
		//GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>().radarEnabled = true;
	}
}

/* enable the pilots radar on leaving the bay. Also unparent from bay so that the ship rotates freely
*/
function OnTriggerEnter(other : Collider){
	if(other.name == "DockChamber"){	
		//transform.parent = null;
		var msg : OSCMessage = OSCMessage("/scene/launchland/launchRadar");
		msg.Append.<int>(0);
		
		OSCHandler.Instance.SendMessageToAll(msg);
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "docking");
		
		//undercarraige state
		msg = OSCMessage("/ship/undercarriage");
		msg.Append.<int>(undercarriage.getGearState());		
		OSCHandler.Instance.SendMessageToAll(msg);
		
		//docking bay grav state
		msg = OSCMessage("/scene/launchland/bayGravity");
		var dockChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
		msg.Append.<int>(dockChamber.gravityOn == true ? 1 : 0);		
		OSCHandler.Instance.SendMessageToAll(msg);
		
		
		
	}
}

/* send out updated power levels to the clients */
function sendPowerLevelUpdate(){
	var m : OSCMessage = OSCMessage("/system/ship/powerLevels");
	m.Append(propulsionPower);
	m.Append(internalPower);
	m.Append(sensorPower);
	m.Append(weaponsPower);


	OSCHandler.Instance.SendMessageToAll(m);
}

function processOSCMessage(msg: OSCPacket){
	
	var msgAddress = msg.Address.Split(["/"[0]]);
	// [1] = System, 2 = Subsystem name, 3 = operation
	var system = msgAddress[2];
	var operation = msgAddress[3];
	
	if(operation == "getPowerLevels"){
		sendPowerLevelUpdate();
	}
}


