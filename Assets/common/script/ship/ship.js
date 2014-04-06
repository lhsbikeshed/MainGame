#pragma strict

private var ship : Transform;
/* scaling factors for motion */
var RotationSpeed : Vector3;
var TranslateSpeed : Vector3;
var thrustSpeed : float;		

var docked : boolean;
var engineSFX : AudioClip;		//engine sound effect
var clampSFX : AudioClip;		//clamp release effect
var weaponsPower  : int = 2;
var sensorPower : int = 2;
var internalPower : int = 2;
var propulsionPower : int = 2;
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


//ships joystick position
var joyPos : Vector3;		//rotation joystick
var translateJoyPos :Vector3;	//translation joystick. Z axis is throttle

//JUMP STUFF

var didWeWarpIn : boolean;	//did we jump into this scene?
var canJump : boolean;		//are we allowed to jump? Used by Jump Node
var inGate : boolean;		//are we in a gate
var inTunnelGate : boolean; //are we in a tunnel gate?
public var jumpDest : int;	//where we jump to
private var controlsLocked : boolean;	//locked controls? (for autopilot or jumps)	
private var jumping : boolean;			//are we currently accelerating for a jump?
private var jumpStartTime : float;		//time we started the jump, jump sequence lasts 7 seconds
private var restoreFov : boolean;			//when a jump is aborted we need to restore fov

// location in sector map
private var sectorPosition : Vector3;


//effects!
private var jumpEffect : ParticleSystem;
private var moveEffects : ParticleSystem;
private var shutterScript : DoorScript;
private var windowScript : FrontWindowBehaviour;
private var canopyObject : Transform;
private var shipCamera : ShipCamera;
private var undercarriage : UndercarriageBehaviour;
var laserTurret : ShipsLaser;


//control stuff
var scaledThrottle : float; //scaled throttle from 0-1.0 
private var thrust : float;	//actual calculated throttle that we use for thrust
var maxThrust : float = 1000;	//max thrust we can apply, modified by prop system

private var throttleDisableTime : float;


//components
private var theCamera : Transform;

//subsystems
private var reactor : Reactor;
private var propulsion : PropulsionSystem;
private var shieldSystem : ShieldSubsystem;
private var jumpSystem : JumpSystem;
private var miscSystem : MiscSystem;

//sound
private var externalSFX : AudioSource;
var hullBreachSFX : AudioSource;
private var rocketSFXSource : AudioSource;


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

	ship = GameObject.Find("TheShip").transform;
	laserTurret = GetComponentInChildren(ShipsLaser);
	theCamera = ship.Find("camera");
	throttleDisableTime = 0.0f;
	controlsLocked = false;
	if(didWeWarpIn){
		restoreFov = true;
		shipCamera.setFovs(180);
	}
	
	//get subsystem refs
	reactor = GetComponent.<Reactor>();
	propulsion = GetComponent.<PropulsionSystem>();
	shieldSystem = GetComponent.<ShieldSubsystem>();
	jumpSystem = GetComponent.<JumpSystem>();
	shipCamera = gameObject.GetComponentInChildren.<ShipCamera>(); //Find("camera").GetComponent.<ShipCamera>();
	undercarriage = GetComponentInChildren.<UndercarriageBehaviour>();
	miscSystem = GetComponent.<MiscSystem>();
	
	
	//effects refs
	moveEffects = transform.Find("Bits").GetComponent.<ParticleSystem>();
	moveEffects.emissionRate = 0.0f;
	jumpEffect = transform.Find("JumpEffects").GetComponent.<ParticleSystem>();
	setJumpEffectState(false);
	windowScript = GetComponentInChildren(FrontWindowBehaviour);
	shutterScript = gameObject.GetComponentInChildren(DoorScript);
	
	
	externalSFX = gameObject.AddComponent("AudioSource");
	rocketSFXSource = gameObject.AddComponent("AudioSource");
	rocketSFXSource.clip = engineSFX;
	rocketSFXSource.loop = true;
	rocketSFXSource.volume = 0.0f;
	rocketSFXSource.Play();
}

//sends things to the client for rendering, throttle, gear state etc
@RPC
function updateClientState(throttle : float){
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
	if(jumping){
		jumpAbort();
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
		yield WaitForSeconds(2) ;
		GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead(deathText);
		
		//silence all of the subsystems
		
		for (var s : AudioSource in GetComponentsInChildren.<AudioSource>()){
			s.Stop();
		}

	}
	
	//strobe light effect is separate
	msg = OSCMessage("/ship/effect/flapStrobe");			
	OSCHandler.Instance.SendMessageToAll(msg);
	
	//randomly pop the flap open
	if(amount > 8.0f && Random.Range(0,100) < 20.0f){
		msg = OSCMessage("/ship/effect/openFlap");			
		OSCHandler.Instance.SendMessageToAll(msg);
	}
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

function forceJump(){

	jumpSystem.go();
	jumpStartTime = Time.fixedTime;
	controlsLocked = true;
	jumping = true;
	rigidbody.drag = 0.05f;
	propulsion.rotationDisabled  = true;
}

/* Begin a jump sequence
 * only works if we are inside a gate ring, the jump system reports its charged
 * and we arent currently jumping (prevents idiots from spamming the jump button 
*/
function startJump(){
	if(inGate && jumpSystem.canJump && !jumping){
		
		jumpSystem.go();
		jumpStartTime = Time.fixedTime;
		controlsLocked = true;
		jumping = true;
		rigidbody.drag = 0.05f;
		propulsion.rotationDisabled  = true;
	}
}

/* abort the jump, called if we smash into something during jumping
*/
function jumpAbort(){
	jumpSystem.abort();
	propulsion.rotationDisabled  = false;
	controlsLocked = false;
	jumping = false;
	rigidbody.drag = 1.0f;
	restoreFov = true;
	thrust = 0;
	scaledThrottle = 0.0f;
	setJumpEffectState(false);
}

/* lock out pilot controls */
function setControlLock(state : boolean){
	controlsLocked = !state;
}


/* tidy up all of the jump effects
*/
function jumpEnd(){
	rigidbody.drag = 1.0f;
	controlsLocked = false;
	propulsion.rotationDisabled  = false;
	jumping = false;
	restoreFov = true;
	jumpSystem.doJump();
}    


/* work out if we can actually jump or not and send that status to the clients
*/
function updateJumpStatus(){

	
	var msg : OSCMessage = OSCMessage("/ship/jumpStatus");	
	if(inGate && jumpSystem.canJump){		
		msg.Append.<int>(1);		
	} else {
		msg.Append.<int>(0);
	}
	OSCHandler.Instance.SendMessageToAll(msg);
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
   	if(didWeWarpIn){
		jumpEnd();
		setJumpEffectState(false);
		didWeWarpIn = false;
		shipCamera.setFovs(180);
	}
}   


/* Release docking clamp
*/
function releaseDock(){
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
function dock(){
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

function OnSerializeNetworkView(stream : BitStream, info : NetworkMessageInfo) {

	stream.Serialize(scaledThrottle);	
}


/*----------------- Updates --------*/
   
function FixedUpdate(){

	acceleration = (rigidbody.velocity - lastVelocity) / Time.fixedDeltaTime;
	lastVelocity = rigidbody.velocity;

	//repair ship hull if power is == 3
	if(internalPower == 3 && reactor.systemEnabled){
		changeHullLevel(0.002f);
		
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
	//read the controls just dont apply them unless controlsLocked is false
	scaledThrottle = translateJoyPos.z;
	propulsion.throttle = scaledThrottle;
	
	thrust = (maxThrust * propulsion.propulsionModifier) * scaledThrottle;
   
    if(thrust < 0){
    	thrust = 0;
    }

	var rx : float = joyPos.z * RotationSpeed.x * propulsion.propulsionModifier;
	var ry : float = joyPos.y * RotationSpeed.y * propulsion.propulsionModifier;
	var rz : float = joyPos.x * RotationSpeed.z * propulsion.propulsionModifier;
	var tx : float = translateJoyPos.x * TranslateSpeed.x * propulsion.propulsionModifier;
	var ty : float = -translateJoyPos.y * TranslateSpeed.y * propulsion.propulsionModifier;
	 
	 
	
 	if (propulsion.rotationDisabled  == false){				//FIX ME
		rigidbody.AddRelativeTorque(Vector3(ry,rz,rx));	   	    
		//rigidbody.velocity = AddPos * (Time.deltaTime * throttle);
	}
	if(propulsion.throttleDisabled == false){
	
		rigidbody.AddForce (transform.TransformDirection(Vector3.forward * thrust * 2));
		rigidbody.AddRelativeForce(Vector3(tx,ty,0));
		rocketSFXSource.volume = scaledThrottle;
		if(docked){
			shipCamera.shaking = true;
			shipCamera.shakeAmount = scaledThrottle / 1.0 * 0.05;
		} else {
			shipCamera.shaking = false;
		}
	}
    	
	
	if(propulsion.systemEnabled == false){
		rocketSFXSource.volume = 0.0f;
	}
	
		
	//if we are jumping then add a massive forward force to accel the ship
	//modify the effects in front of ship depending on how fast were going
	if(jumping){
		rigidbody.AddForce (transform.TransformDirection(Vector3.forward * 15000));
		
		if(Time.fixedTime - jumpStartTime > 2){	//turn on effects at 2 seconds
			
			setJumpEffectState(true);
			shipCamera.setFovs(85 + ((Time.fixedTime - jumpStartTime - 4) / 3.0f ) * 30);
		}
			
		//JUMP!
		if (Time.fixedTime - jumpStartTime  > 5){	//jump at 7 seconds
			
			jumpEnd();
			if(inTunnelGate){
				//signal testing scene the jump started
				GameObject.Find("SceneScripts").GetComponent.<TestingScene>().tunnelStart();
			} else {
				
				Application.LoadLevel(jumpDest);
				
			}
			Debug.Log("JUMP!");
			
		} 
	}
	
	//restore fov after a jump - not used until i split the guilayer and game into seperate cameras
	if (restoreFov){
		shipCamera.setFovs( Mathf.Lerp(theCamera.camera.fov,85,Time.deltaTime * 5.0) );
		if (theCamera.camera.fov <= 85.0f){
			shipCamera.setFovs(85.0f);
			restoreFov = false;
		}
		
	}
	
	//sfx for movement
	moveEffects.emissionRate = rigidbody.velocity.magnitude / 10.0f;
}


//blow the ship up and surround with explosions
function Explode(){
	CabinEffects.Instance().setRedAlert(false);
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

@RPC
function setJumpEffectState(state : boolean){
	if(PersistentScene.networkReady){
		networkView.RPC("setJumpEffectState", RPCMode.Others, state);
	}
	if(jumpEffect == null){
		jumpEffect = transform.Find("JumpEffects").GetComponent.<ParticleSystem>();
	}
	if(state){
		jumpEffect.enableEmission = true;
	} else {
		jumpEffect.enableEmission = false;
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
