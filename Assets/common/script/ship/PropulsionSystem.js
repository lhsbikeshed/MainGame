#pragma strict

/* should this class spawn two engine colliders?
*/
class PropulsionSystem extends BaseSubsystem
{

	/* scaling factors for motion */
	var RotationSpeed : Vector3;
	var TranslateSpeed : Vector3;
	var thrustSpeed : float;		
	
	var propulsionModifier : float; //how much we modify the actual throttle on the ship
	var propulsionOffset : Vector3; //on damage we should vector the thrust
	var hyperspaceModifier : boolean = false; //is the hyeprspace charging and gimping the engines
	var propulsionPowerMapping : AnimationCurve;
	
	var thrustReverser : boolean = false;
	var thrustOutSound : AudioClip;
	var thrustInSound : AudioClip;

	var throttleDisabled : boolean = true;
	var rotationDisabled : boolean = true;
	var translationDisabled : boolean = true;
	
	// are we in the loading bay at the moment, if so then gimp the throttle
	var inBay : boolean = false;
	
	//lights and particles
	var engineParticles : ParticleSystem;
	var particleRate : AnimationCurve;
	var baseEmissionRate : float;
	var engineLight : Light;
	
	//afterburner stuff
	public var afterburnerClip : AudioClip;
	var afterburnerStartTime : float;
	var afterburnerCooldown : float = 2.0f;
	var afterburnerCooling : boolean = false;
	
	
	//actual control stuff
	//ships joystick position
	var joyPos : Vector3;		//rotation joystick
	var translateJoyPos :Vector3;	//translation joystick. Z axis is throttle
	//control stuff
	var scaledThrottle : float; //scaled throttle from 0-1.0 
	private var thrust : float;	//actual calculated throttle that we use for thrust
	var maxThrust : float = 1000;	//max thrust we can apply, modified by prop system

	//audio
	private var rocketSFXSource : AudioSource;

	var engineSFX : AudioClip;		//engine sound effect
	
	public static var instance : PropulsionSystem;
	
	
	function Start(){
		super.Start();
		
		
		rocketSFXSource = gameObject.AddComponent("AudioSource");
		rocketSFXSource.clip = engineSFX;
		rocketSFXSource.loop = true;
		rocketSFXSource.volume = 0.0f;
		rocketSFXSource.Play();
			
	
		
	}
	
	function Awake(){
		theShip = GameObject.Find("TheShip");
		instance = this;
	}
	
	function disableSystem(){
		systemEnabled = false;
		
		theShip.rigidbody.drag = 0.0f;
		propulsionModifier = 0.0f;
		throttleDisabled = true;
		rotationDisabled = true;
		translationDisabled = true;
		engineParticles.enableEmission = false;
	}
	
	function enableSystem(){
		afterburnerCooling = false;
		
		systemEnabled = true;
		theShip.rigidbody.drag = 0.5f;
		throttleDisabled = false;
		rotationDisabled = false;
		translationDisabled = false;
		engineParticles.enableEmission = true;
		engineParticles.emissionRate = baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		engineParticles.startSpeed = -baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		
		
	}
	
	function FixedUpdate () {
		if(systemEnabled){
			if(afterburnerCooling){
				afterburnerCooldown -= Time.fixedDeltaTime;
				if(afterburnerCooldown < 0.0f){
					//send a message to clients to say afterburner is active again
					afterburnerCooling = false;
					var m: OSCMessage = OSCMessage("/system/propulsion/afterburnerCharged");
					OSCHandler.Instance.SendMessageToAll(m);
				}
			}
		}
			
				
				
		//lookup the propulsion modifier for the given amount of power in this system
		var propLookup = UsefulShit.map(theShip.GetComponent.<ShipCore>().getPropulsionPower(), 0, 12, 0f, 1f);		
		propulsionModifier = propulsionPowerMapping.Evaluate(propLookup);
		if(inBay){
			propulsionModifier *= 0.5f;
		}
		
		//gimp engines if hyperspace is on
		if(hyperspaceModifier == true){
			propulsionModifier *= 0.3f;
		}
		
		
		//read the controls just dont apply them unless controlsLocked is false
		scaledThrottle = translateJoyPos.z;
		
		
		thrust = (maxThrust * propulsionModifier) * scaledThrottle;
	   
	    if(thrust < 0){
	    	thrust = 0;
	    }

		var rx : float = joyPos.z * RotationSpeed.x * propulsionModifier;
		var ry : float = joyPos.y * RotationSpeed.y * propulsionModifier;
		var rz : float = joyPos.x * RotationSpeed.z * propulsionModifier;
		var tx : float = translateJoyPos.x * TranslateSpeed.x * propulsionModifier;
		var ty : float = -translateJoyPos.y * TranslateSpeed.y * propulsionModifier;
		 
		 
		
	 	if (rotationDisabled  == false){				//FIX ME
			rigidbody.AddRelativeTorque(Vector3(ry,rz,rx));	   	    
			//rigidbody.velocity = AddPos * (Time.deltaTime * throttle);
		}
		if(throttleDisabled == false){
			if(afterburnerStartTime + 2.0f > Time.fixedTime){	//afterburner is active
				thrust += 9000.0f;
				if (afterburnerCooling == false ){
					afterburnerCooldown = 8.0f;
					afterburnerCooling = true;
					var me: OSCMessage = OSCMessage("/system/propulsion/afterburnerCharging");
					OSCHandler.Instance.SendMessageToAll(me);
				}
			} 
			if(!thrustReverser){
				rigidbody.AddForce (transform.TransformDirection(Vector3.forward * thrust * 2));
			} else {
				rigidbody.AddForce (transform.TransformDirection(Vector3.forward * thrust * -0.5f));
			}
			
			rocketSFXSource.volume = scaledThrottle;
		}
		if(translationDisabled == false){
			rigidbody.AddRelativeForce(Vector3(tx,ty,0));
		}
	    	
		
		if(systemEnabled == false){
			rocketSFXSource.volume = 0.0f;
			
		}
		
		
		
		
	}
	
	function setThrustReverserState(state : boolean){
		if(thrustReverser != state){
		
			thrustReverser = state;
			if(state){
				//deploy noise
				AudioSource.PlayClipAtPoint(thrustOutSound, transform.position);
			} else {
				//retract noise
				AudioSource.PlayClipAtPoint(thrustInSound, transform.position);
			}
		}
	}
	
	function startAfterburner(){
		if(!systemEnabled ) return;
		
		var m : OSCMessage;
		if(afterburnerCooling || thrustReverser){		//no afterburner if the reverser is deployed or the ab is cooling
			//send an afterburner off warning
			m = OSCMessage ("/system/propulsion/afterburnerOffline");
			OSCHandler.Instance.SendMessageToAll(m);
		} else {
			
			//start afterburner
			afterburnerStartTime = Time.fixedTime;
			//trigger afterburner effect
			var a : AudioSource = UsefulShit.PlayClipAt(afterburnerClip, transform.position);
			a.pitch = Random.Range(0.8f, 1.2f);
			//tell clients it worked
			m = OSCMessage ("/system/propulsion/afterburnerActive");
			OSCHandler.Instance.SendMessageToAll(m);
		}
		
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
		} else if (operation == "afterburner"){
			startAfterburner();
		} else if (operation == "setThrustReverser"){
			var b : int = message.Data[0];
			setThrustReverserState(b == 1 ? true : false);
		}
		/*else if (operation == "throttle"){
			var throttle : float = message.Data[0] ;
			scaledThrottle =  throttle;
		}*/
	}
	
	
}