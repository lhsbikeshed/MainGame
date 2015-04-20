using UnityEngine;
using System;
using UnityOSC;

/* should this class spawn two engine colliders?
*/
[System.Serializable]
public class PropulsionSystem: BaseSubsystem
{

	/* scaling factors for motion */
	public Vector3 RotationSpeed;
	public Vector3 TranslateSpeed;
	public float thrustSpeed;		
	
	public float propulsionModifier; //how much we modify the actual throttle on the ship
	public Vector3 propulsionOffset; //on damage we should vector the thrust
	public bool hyperspaceModifier = false; //is the hyeprspace charging and gimping the engines
	public AnimationCurve propulsionPowerMapping;
	
	public bool thrustReverser = false;
	public AudioClip thrustOutSound;
	public AudioClip thrustInSound;

	public bool throttleDisabled = true;
	public bool rotationDisabled = true;
	public bool translationDisabled = true;
	
	//lights and particles
	public ParticleSystem engineParticles;
	public AnimationCurve particleRate;
	public float baseEmissionRate;
	public Light engineLight;
	
	//afterburner stuff
	public AudioClip afterburnerClip;
	public float afterburnerStartTime;
	public float afterburnerCooldown = 2.0f;
	public bool afterburnerCooling = false;
	
	
	//actual control stuff
	//ships joystick position
	public Vector3 joyPos;		//rotation joystick
	public Vector3 translateJoyPos;	//translation joystick. Z axis is throttle
	//control stuff
	public float scaledThrottle; //scaled throttle from 0-1.0 
	float thrust;	//actual calculated throttle that we use for thrust
	public float maxThrust = 1000.0f;	//max thrust we can apply, modified by prop system

	//audio
	AudioSource rocketSFXSource;

	public AudioClip engineSFX;		//engine sound effect
	
	public static PropulsionSystem instance;
	
	
	public override void Start(){
		base.Start();
		
		
		rocketSFXSource = gameObject.AddComponent<AudioSource>();
		rocketSFXSource.clip = engineSFX;
		rocketSFXSource.loop = true;
		rocketSFXSource.volume = 0.0f;
		rocketSFXSource.Play();
			
	
		
	}
	
	public override void Awake(){
		theShip = GameObject.Find("TheShip");
		instance = this;
	}
	
	public override void disableSystem(){


		systemEnabled = false;
		
		theShip.GetComponent<Rigidbody>().drag = 0.0f;
		propulsionModifier = 0.0f;
		throttleDisabled = true;
		rotationDisabled = true;
		translationDisabled = true;
		engineParticles.enableEmission = false;
	}
	
	public override void enableSystem(){
		if(reactor.systemEnabled == false) return;

		afterburnerCooling = false;
		
		systemEnabled = true;
		theShip.GetComponent<Rigidbody>().drag = 0.5f;
		throttleDisabled = false;
		rotationDisabled = false;
		translationDisabled = false;
		engineParticles.enableEmission = true;
		engineParticles.emissionRate = baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		engineParticles.startSpeed = -baseEmissionRate * particleRate.Evaluate(scaledThrottle);
		
		
	}
	
	public void FixedUpdate() {
		if(systemEnabled){
			if(afterburnerCooling){
				afterburnerCooldown -= Time.fixedDeltaTime;
				if(afterburnerCooldown < 0.0f){
					//send a message to clients to say afterburner is active again
					afterburnerCooling = false;
					OSCMessage m = new OSCMessage("/system/propulsion/afterburnerCharged");
					OSCHandler.Instance.SendMessageToAll(m);
				}
			}
		}
			
				
				
		//lookup the propulsion modifier for the given amount of power in this system
		float propLookup = UsefulShit.map((float)theShip.GetComponent<ShipCore>().getPropulsionPower(), 0.0f, 12.0f, 0f, 1f);		
		propulsionModifier = propulsionPowerMapping.Evaluate(propLookup);
		//TODO fix this

		//gimp the engines if the undercarriage is down
		if(UndercarriageBehaviour.Instance.state != UndercarriageBehaviour.UP){
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
	    	thrust = 0.0f;
	    }

		float rx = joyPos.z * RotationSpeed.x * propulsionModifier;
		float ry = joyPos.y * RotationSpeed.y * propulsionModifier;
		float rz = joyPos.x * RotationSpeed.z * propulsionModifier;
		float tx = translateJoyPos.x * TranslateSpeed.x * propulsionModifier;
		float ty = -translateJoyPos.y * TranslateSpeed.y * propulsionModifier;
		 
		 
		
	 	if (rotationDisabled  == false){				//FIX ME
			GetComponent<Rigidbody>().AddRelativeTorque(new Vector3(ry,rz,rx));	   	    
			//rigidbody.velocity = AddPos * (Time.deltaTime * throttle);
		}
		if(throttleDisabled == false){
			if(afterburnerStartTime + 2.0f > Time.fixedTime){	//afterburner is active
				thrust += 9000.0f;
				if (afterburnerCooling == false ){
					afterburnerCooldown = 8.0f;
					afterburnerCooling = true;
					OSCMessage me = new OSCMessage("/system/propulsion/afterburnerCharging");
					OSCHandler.Instance.SendMessageToAll(me);
				}
			} 
			if(!thrustReverser){
				GetComponent<Rigidbody>().AddForce (transform.TransformDirection(Vector3.forward * thrust * 2));
			} else {
				GetComponent<Rigidbody>().AddForce (transform.TransformDirection(Vector3.forward * thrust * -0.5f));
			}
			
			rocketSFXSource.volume = scaledThrottle;
		}
		if(translationDisabled == false){
			GetComponent<Rigidbody>().AddRelativeForce(new Vector3(tx,ty,0.0f));
		}
	    	
		
		if(systemEnabled == false){
			rocketSFXSource.volume = 0.0f;
			
		}
		
		
		
		
	}
	
	public void setThrustReverserState(bool state){
		if(reactor.systemEnabled == false) return;

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
	
	public void startAfterburner(){
		//if reactor is off or the jump system is charging then do nothing
		if(!systemEnabled || JumpSystem.Instance.systemEnabled == true) return;
		
		OSCMessage m = null;
		if(afterburnerCooling || thrustReverser){		//no afterburner if the reverser is deployed or the ab is cooling
			//send an afterburner off warning
			m = new OSCMessage ("/system/propulsion/afterburnerOffline");
			OSCHandler.Instance.SendMessageToAll(m);
		} else {
			
			//start afterburner
			afterburnerStartTime = Time.fixedTime;
			//trigger afterburner effect
			AudioSource a = UsefulShit.PlayClipAt(afterburnerClip, transform.position);
			a.pitch = UnityEngine.Random.Range(0.8f, 1.2f);
			//tell clients it worked
			m = new OSCMessage ("/system/propulsion/afterburnerActive");
			OSCHandler.Instance.SendMessageToAll(m);
		}
		
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
		} else if (operation == "afterburner"){
			startAfterburner();
		} else if (operation == "setThrustReverser"){
			int b = (int)message.Data[0];
			setThrustReverserState(b == 1 ? true : false);
		}
		/*else if (operation == "throttle"){
			var throttle : float = message.Data[0] ;
			scaledThrottle =  throttle;
		}*/
	}
	
	
}
