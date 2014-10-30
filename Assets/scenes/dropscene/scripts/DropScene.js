#pragma strict

class DropScene extends GenericScene {

	
	var altitude : float; //our altitude above planet
	private var prevFrameAltitude : float;	//altitude at prev frame for counting
	var maxAltitude : float; //start of altitude effects
	var minAltitude : float; //Exposure to this altitude results in death
	
	var maxShipSpinRate : float;	//max amount the ship to tumble
	
	var explodeSound : AudioClip;
	var windClip : AudioClip;
	
	var rotateStrength : float = 1.0f;
	
	var hulltemperature : float[]; //top/bottom/front/back/left/right
	private var hullDirections : Vector3[]; //maps hull temps to directions
	var heating : boolean = true;
	
	var diffVector : Vector3 ; //direction to fireball
	
	private var theShip : GameObject; //the ship
	private var planet : Transform; // planet reference
	private var skyCam : Transform; //skybox camera
	private var fogball : Renderer; //ball of fog around the ship
	private var fireBall : ParticleSystem;	//fire particles
	private var fireBallSound : AudioSource; //sound of the fireball
	private var fireballObject : Transform;
	private var dustBallObject : ParticleSystem;
	public var fireballLight : Light;
	
	private var sceneEntryTime : float; //time we entered the scene
	
	var warningLoop : AudioClip;
	var altitudeWarning : AudioClip;
	var jumpFail : AudioClip;
	private var warningAudio : AudioSource; //general warning, this gets more frequent the lower down the ship gets
	private var lastWarningTime : float;
	private var warningTimer : float;
	
	private var playersFailed : boolean;
	private var weAreDying : boolean = false;
	private var deathTime : float;
	
	private var whiteOverlay : GUITexture;
	private var initialKick : boolean = true;
	
	//urgh
	var airForce : float = 0.5f;
	
	//turbulence
	private var lastTurbulence : float;
	private var nextTurbulence : float;
	
	//ship refs
	private var jumpSystem : JumpSystem;
	private var jumpRoute : int  = -1;
	private var puzzleComplete : boolean = false;
	
	function Start () {
		//get references
		planet = GameObject.Find("planet").transform;
		skyCam = GameObject.Find("skyboxCamera").transform;
		fogball = GameObject.Find("fogrenderer").GetComponent.<Renderer>();
		fireballObject = GameObject.Find("atmosphereparticle").transform;
		fireBall = fireballObject.GetComponent.<ParticleSystem>();
		fireBallSound = GameObject.Find("atmosphereparticle").GetComponent.<AudioSource>();
		dustBallObject = gameObject.Find("dustparticle").GetComponent.<ParticleSystem>();
		theShip = GameObject.Find("TheShip");
		jumpSystem = theShip.GetComponent.<JumpSystem>();
		//we store this so that the players cant accidentally override it. if they do then we force it back
		//on the console. The ship will then emergency jump down the right route
		jumpRoute = jumpSystem.jumpRoute;
		
		hulltemperature = new float[6];
		hullDirections = new Vector3[6];
		hullDirections[0] = Vector3.up;
		hullDirections[1] = Vector3.down;
		hullDirections[2] = Vector3.left;
		hullDirections[3] = Vector3.right;
		hullDirections[4] = Vector3.forward;
		hullDirections[5] = Vector3.back;
		
		fogball.material.color.a = 0;
		fireBall.startSize = 0;
		
		
		//disable bits of ship we dont need
		// ship enters scene with fucked engines, add gravity and disable buggered systems.
		//add some drag otherwise we ping off into space
		theShip.Find("Bits").active = false;
		theShip.rigidbody.useGravity = true;
		theShip.rigidbody.drag = 0.0f;
		
		//turn off the propulsion system but allow rotations
		theShip.GetComponent.<PropulsionSystem>().disableSystem();
		theShip.GetComponent.<PropulsionSystem>().rotationDisabled = false;
	
		//turn off jumpSystem	
		theShip.GetComponent.<JumpSystem>().disableSystem();
		//theShip.rigidbody.drag = 0.5f;
	
		//add a little forward speed to the drop and add a roll rotation to show we came out of warp badly
		theShip.rigidbody.velocity = theShip.transform.rotation * Vector3.forward * 100;
		
		
		theShip.GetComponent.<MiscSystem>().setExternalLight(false);	//ext light kills the planet shader
		theShip.GetComponent.<MiscSystem>().consuming = false;			//disable o2 consumption as we cant raise its level while falling
																		//next scene is warp and will reenable at exit
		
		//audio
		warningAudio = gameObject.AddComponent.<AudioSource>();
		warningAudio.clip = warningLoop;
		warningAudio.loop = false;
		warningAudio.dopplerLevel = 0.0f;
		warningTimer = 10;
		
		whiteOverlay = GameObject.Find("whiteout").GetComponent.<GUITexture>();
		
		weAreDying = false;
		
		
		altitude =  Vector3.Distance(planet.position, skyCam.position) * 10;
		prevFrameAltitude = altitude;
		
		AudioSource.PlayClipAtPoint(jumpFail, theShip.transform.position);
		
		//set up turbulence stuff
		lastTurbulence = Time.fixedTime + 3.0;
		nextTurbulence = Random.Range(5.0, 15.0);
		
	}
	
	function updateFireballDirection(){
		diffVector = fireballObject.position - theShip.transform.position;
		diffVector = (Quaternion.Inverse(theShip.transform.rotation) * diffVector).normalized;
		
		
	}
	
	function FixedUpdate(){
		//disable drag for now, not physically accurate but fuck it
		theShip.rigidbody.drag = 0.0f;
		//kick the ship slightly as we fail the exit
		if(initialKick){
			theShip.rigidbody.AddRelativeTorque(Vector3(0,0,50), ForceMode.Impulse);
			initialKick = false;
		}
		
		if(lastTurbulence + nextTurbulence < Time.fixedTime){
			lastTurbulence = Time.fixedTime;
			nextTurbulence = Random.Range(8.0, 20.0);
			OSCHandler.Instance.SendMessageToAll(OSCMessage("/scene/drop/turbulenceWarning"));
			var ranVec : Vector3 = Random.onUnitSphere;
			ranVec.z = 0;
			ranVec *= Random.Range(300.0, 650.0);
			theShip.rigidbody.AddRelativeTorque(ranVec, ForceMode.Impulse);
		}
		
		
		//slowly rotate the ship toward the fireball
		theShip.rigidbody.AddTorque(Vector3.Cross(theShip.transform.forward, theShip.rigidbody.velocity.normalized) * airForce, ForceMode.Force);
		
		//check if the altitude has crossed a 1000/100 barrier and speak it out
		prevFrameAltitude = altitude;
		altitude =  Vector3.Distance(planet.position, skyCam.position) * 10;
		var pAlt : int;
		var tAlt : int;
		if(altitude < maxAltitude){
			pAlt =  Mathf.FloorToInt( ( prevFrameAltitude - minAltitude) / 1000.0f);
		 	tAlt = Mathf.FloorToInt((altitude - minAltitude) / 1000.0f);
			if( pAlt != tAlt ){
			//
				theShip.GetComponent.<DistanceSpeaker>().SpeakDistance(pAlt * 1000,1000);
			}
		
			//calculate ship spin
			var spin : float = map (altitude, maxAltitude, minAltitude, 0 ,maxShipSpinRate);
			
			//theShip.rigidbody.AddTorque(Vector3(0,spin,0));
			//calculate atmosphere bubble alpha
			var alpha : float = map(altitude, maxAltitude, minAltitude, 0.2, 0.9);
			
			fogball.material.color.a = alpha;
			if(altitude > 28000){
				//particle speed and size
				var speed : float = map(altitude, maxAltitude, minAltitude, 15, 35);
				fireBall.startSpeed = -speed;
				
				var size : float = map(altitude, maxAltitude, minAltitude, 0, 20);
				fireBall.startSize = size;
				
				fireBallSound.volume = map(altitude, maxAltitude, minAltitude, 0.5, 1.0);
				if(weAreDying){
					fireBallSound.volume -= 0.2;
				}
				fireBallSound.pitch = map(altitude, maxAltitude, minAltitude, 0.2, 1.0);
				fireballLight.intensity = 2.0f + fireBallSound.pitch * 5.0f + Random.Range(-1.0f, 1.0f);
			} else {
				pAlt =  Mathf.FloorToInt( ( prevFrameAltitude - minAltitude) / 100.0f);
			 	tAlt = Mathf.FloorToInt((altitude - minAltitude) / 100.0f);
				if( Mathf.FloorToInt(prevFrameAltitude / 100.0f) != Mathf.FloorToInt(altitude / 100.0f) ){
					theShip.GetComponent.<DistanceSpeaker>().SpeakDistance(pAlt * 100,100);
				}
				heating = false;
				if(fireBall.enableEmission == true){
					fireballLight.intensity = 0.0f;
					fireBall.enableEmission = false;
					fireBallSound.clip = windClip;
					fireBallSound.volume = 1.0;
					fireBallSound.Play();
					
				}
			}
			
			//work out hull temps
			
			for(var i : int ; i < 6; i++){
				if(heating){
					var amt : float = Vector3.Dot(theShip.transform.rotation * hullDirections[i], theShip.rigidbody.velocity.normalized);
					hulltemperature[i] += amt / 10.0f;
					if(hulltemperature[i] < 10){
						hulltemperature[i] = 10;
					}
					
					if(hulltemperature[i] > 300){
					//we died
						playerDied();
						
					}  
				} else {
					hulltemperature[i] -= 10.0f;
					if(hulltemperature[i] < 10){
						hulltemperature[i] = 10;
					}
				}
			}
			//update radar directions
			updateFireballDirection();
			
			
			if(lastWarningTime + warningTimer < Time.fixedTime){
				lastWarningTime = Time.fixedTime;
				warningTimer = map(altitude, maxAltitude, minAltitude, 4,2);
				if(altitude < 28000){
					warningAudio.PlayClipAtPoint(altitudeWarning, theShip.transform.position);
				} else {
					warningAudio.PlayClipAtPoint(warningLoop, theShip.transform.position);
				}
				if(Random.Range(0,100) < 15){
					theShip.GetComponent.<ship>().damageShip(0, "Hull Smashed By Atmosphere");
			}	}
			
		} else {
			fogball.material.color.a = 0;
			fireBall.startSize = 0;
			fireBallSound.volume  =0;
			fireBallSound.pitch = 0.2;
		}
		
		if(altitude < minAltitude){
			//OH FUCK
			hitPlanet();
		}
		
		//fix possible jump route overwrites
		//if the players manage to reset the route then force it to the one we had when starting the scene
		if(puzzleComplete && jumpSystem.jumpRoute < 0){
			jumpSystem.jumpDest = 1;
		
			jumpSystem.canJump = true;
			jumpSystem.inGate = true;
			jumpSystem.jumpRoute = jumpRoute;
			jumpSystem.updateJumpStatus();
			
			var s1 : OSCMessage = OSCMessage("/ship/jumpStatus");
			s1.Append.<int>(jumpRoute);
			OSCHandler.Instance.SendMessageToAll(s1);
			
		}
						
	}
	function hitPlanet(){
		//silence all sounds, play a humongous crash and kill the players. Black out screen
		if(weAreDying == false){
			theShip.rigidbody.constraints = RigidbodyConstraints.FreezeAll;	//freeze ship in place
		
			deathTime = Time.fixedTime;
			weAreDying = true;
			fireBallSound.volume = 0;
			//var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			//ps.shipDead("Crashed into planet");
			theShip.GetComponent.<ship>().damageShip(1000, "Smeared across surface of a dust planet");
		}
	}
		
	function playerDied(){
		if(weAreDying == false){
			deathTime = Time.fixedTime;
			weAreDying = true;
			
			
			OSCHandler.Instance.SendMessageToAll(OSCMessage("/scene/drop/structuralFailure"));
		
			AudioSource.PlayClipAtPoint(explodeSound, theShip.transform.position);
			
			yield WaitForSeconds(16);
			theShip.GetComponent.<ship>().damageShip(1000, "Burnt by the fires of unplanned re-entry");
			//yield.WaitForSeconds(2);
		
			//var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			//ps.shipDead("Burnt by the fires of unplanned re-entry");
			
			
		}
	}
	
	
	function Update () {
		if(weAreDying && Time.fixedTime - deathTime > 14.7){
			whiteOverlay.color.a = Mathf.Lerp(0.0f, 1.00, (Time.fixedTime - deathTime) / 3.3);
		}
	
	
	}
	
	function map(x : float, in_min : float, in_max : float, out_min : float, out_max : float) : float
	{
	  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	
	
	//OSC HANDLERS
	function ProcessOSCMessage(message : OSCPacket){
		var msgAddress = message.Address.Split(separator);
		
		var operation = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(operation){
			
			
			case "droppanelrepaired":
				//drop scene equipment has been repaired, so turn on propulsion and jump, set jump coords
				//to next scene and set ship to allow jump
				if(Application.loadedLevel == 2){
					if(message.Data[0] == 1){		//panel hardware was repaired but not auth
						var s : OSCMessage = OSCMessage("/scene/drop/panelRepaired");
						
						OSCHandler.Instance.SendMessageToAll(s);
					
					} else if (message.Data[0] == 2){
						theShip.GetComponent.<JumpSystem>().enableSystem();
						theShip.GetComponent.<PropulsionSystem>().enableSystem();
						var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
						ps.hyperspaceDestination = 3;
						ps.forcedHyperspaceFail = false;	
						theShip.GetComponent.<JumpSystem>().jumpDest = 1;
		
						theShip.GetComponent.<JumpSystem>().canJump = true;
						theShip.GetComponent.<JumpSystem>().inGate = true;
						theShip.GetComponent.<JumpSystem>().jumpRoute = 1;
						var s1 : OSCMessage = OSCMessage("/ship/jumpStatus");
						s1.Append.<int>(1);
						OSCHandler.Instance.SendMessageToAll(s1);
						
						puzzleComplete = true;
						
					}
					
				}
					
				break;
				
				
		}	
		
	
	}
	
	function LeaveScene(){
		OSCHandler.Instance.RevertClientScreen("PilotStation", "drop");			
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "drop");		
		OSCHandler.Instance.RevertClientScreen("EngineerStation", "drop");			
	}
	
	function SendOSCMessage(){
		
		var msg : OSCMessage = OSCMessage("/scene/drop/statupdate");
		msg.Append.<float>(altitude - minAltitude);
		for(var i : int = 0; i < 6; i++){
			msg.Append.<float>(hulltemperature[i]);
		}
				
		msg.Append.<float>(diffVector.x);
		msg.Append.<float>(diffVector.y);
		msg.Append.<float>(diffVector.z);
		OSCHandler.Instance.SendMessageToAll(msg);
	
	
	}
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "drop", true);			
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "drop", true);		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "drop", true);			
	
	}
	
	
}