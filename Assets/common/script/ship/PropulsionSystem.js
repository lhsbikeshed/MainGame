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
	
	var throttleDisabled : boolean = true;
	var rotationDisabled : boolean = true;
	
	var inBay : boolean = false;
	
	var propulsionPowerModifier : float[];
	
	var engineParticles : ParticleSystem;
	var particleRate : AnimationCurve;
	var baseEmissionRate : float;
	var engineLight : Light;
	
	
	
	
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
	
	
	
	function Start(){
		super.Start();
		propulsionPowerModifier = new float[3];
		propulsionPowerModifier[0] = 0.3f;
		propulsionPowerModifier[1] = 0.5f;
		propulsionPowerModifier[2] = 0.7f;
		
		
		rocketSFXSource = gameObject.AddComponent("AudioSource");
		rocketSFXSource.clip = engineSFX;
		rocketSFXSource.loop = true;
		rocketSFXSource.volume = 0.0f;
		rocketSFXSource.Play();
			
	
		
	}
	
	function Awake(){
		theShip = GameObject.Find("TheShip");
	}
	
	function disableSystem(){
		systemEnabled = false;
		
		theShip.rigidbody.drag = 0.0f;
		propulsionModifier = 0.0f;
		throttleDisabled = true;
		rotationDisabled = true;
		engineParticles.enableEmission = false;
	}
	
	function enableSystem(){
		systemEnabled = true;
		theShip.rigidbody.drag = 0.5f;
		throttleDisabled = false;
		rotationDisabled = false;
		engineParticles.enableEmission = true;
		engineParticles.emissionRate = baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		engineParticles.startSpeed = -baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		
		
	}
	
	function FixedUpdate () {
		

		propulsionModifier = propulsionPowerModifier[theShip.GetComponent.<ship>().propulsionPower - 1]; //(1 + theShip.GetComponent.<ship>().propulsionPower) / 4.0f;
		if(inBay){
			propulsionModifier *= 0.5f;
		}
		
		//gimp engines if hyperspace is on
		if(hyperspaceModifier == true){
			propulsionModifier *= 0.3f;
		}
		
		//on damage to left and right engines we should return some sort of direction for the ship to move in
		//to simulate engines being borked
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
		
			rigidbody.AddForce (transform.TransformDirection(Vector3.forward * thrust * 2));
			rigidbody.AddRelativeForce(Vector3(tx,ty,0));
			rocketSFXSource.volume = scaledThrottle;

		}
	    	
		
		if(systemEnabled == false){
			rocketSFXSource.volume = 0.0f;
			
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
		} /*else if (operation == "throttle"){
			var throttle : float = message.Data[0] ;
			scaledThrottle =  throttle;
		}*/
	}
	
	
}