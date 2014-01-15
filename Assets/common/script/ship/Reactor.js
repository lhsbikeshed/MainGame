#pragma strict

/* reactor generates energy
 * also its the control class for all subsystems
 */
class Reactor extends MonoBehaviour{
	
	var generationRate : float = 1.0f;		//rate at which we generate energy
	var currentEnergy : float = 500.0f;
	var maxEnergy : float = 2000;
	var damage : float = 1.0f;				//percentage fuckedness
	var brokenBoot : boolean = false;		//is the next bootup broken?
	
	var systemEnabled : boolean;
	var runningQuiet : boolean = false;
	var spoolSound : AudioClip;
	var stopSound : AudioClip;
	var runningSound : AudioClip;
	var failSound : AudioClip;
	var startupSounds  :AudioClip[];
	var firstTimeSound : AudioClip;
	
	var warningClips : AudioClip[];
	
	private var firstStart = true;
	private var theShip : GameObject;
	
	private var subsystems : BaseSubsystem[];
	private var soundSource : AudioSource;
	private var speechSource : AudioSource;
	
	
	var destructStart : AudioClip;
	var destructAbort : AudioClip;
	var overloadSound : AudioClip;
	var overloadTime : int = 60;
	private var overloadStart : float;
	 var overloading : boolean;
	private var lastSecondCounter : int = 0;
	
	private var separator : char[] = ["/"[0]];
	
	
	
	/*
	* Reactor produces energy for subsystems
	*/
	function Start () {
		theShip = GameObject.Find("TheShip");
		soundSource = gameObject.AddComponent("AudioSource");
		speechSource = gameObject.AddComponent("AudioSource");
		if(systemEnabled ==  false){
			var msg : OSCMessage = OSCMessage("/system/reactor/stateUpdate");		
			msg.Append.<int>( 0 );			
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	function isOverloading() : boolean {
		return overloading;
	}
	
	/* Consume some power
	 * if at the next update this would consume our energy
	 * then return amount given
	 * subsystems should then NOT turn on
	 */
	function consumePower(amount : float) : float
	{
		
		if (currentEnergy - amount >= 0.0f){
			currentEnergy -= amount;
			return amount;
		} else {
			var ret : float = currentEnergy;
			currentEnergy = 0.0f;
			disableSystem();	//actually need to broadcast a "shut everything off" message here to power off lights etc
			return ret;
		}
	}
	
	function reactorState(st :int){
	
	//these sounds are now played at the actual console
//		st = st - 1;//for odd reasons the vals off the switch panel are off by one
//					//st == 0 is the reactor being shut down by panel switches being wrong
//		if(st <= 4){
//			speechSource.Stop();
//			speechSource.clip = startupSounds[0];
//			//speechSource.Play();
//			CabinEffects.Instance().QueueVoiceOver(startupSounds[0]);
//		
//		} else if (st < 9){
//			CabinEffects.Instance().QueueVoiceOver(startupSounds[1]);
//		} else {
//			CabinEffects.Instance().QueueVoiceOver(startupSounds[3]);
//		}
	}
	
	/* quickly boot the reactor after a lightning strike*/
	function quickBoot(){
		if(systemEnabled == false){
			if( runningQuiet == true){
				systemEnabled = true;
				runningQuiet = false;
				soundSource.clip = runningSound;
				soundSource.loop = true;
				soundSource.Play();
				
				var msg : OSCMessage = OSCMessage("/system/reactor/stateUpdate");		
				msg.Append.<int>( 1 );
				
				msg.Append.<String>( generateFlagString() + ";QUICKBOOT;" ); 			
				OSCHandler.Instance.SendMessageToAll(msg);
			} else {
				enableSystem();
			}
		}
	}
	
	function goQuiet(){
		if(systemEnabled == true && runningQuiet == false){
			soundSource.Stop();
			soundSource.clip = stopSound;
			soundSource.loop = false;
			soundSource.Play();
			systemEnabled = false;
			runningQuiet = true;
			var msg : OSCMessage = OSCMessage("/system/reactor/stateUpdate");		
			msg.Append.<int>( 0 );								//FIXME change this to a "quiet" state
			msg.Append.<String>( generateFlagString() + ";GOQUIET;" ); 	
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	/* kill the reactor and play the reactor spazz sound */
	function lightningStrike(){
		if(systemEnabled == true){
			if(!runningQuiet){		//if we arent running quietly then damage the ship
				theShip.GetComponent.<ship>().damageShip(Random.Range(5,10), "Destroyed by nebula lightning");
			} 
				
			reactorFailure();
			
		}
	}
	
	function generateFlagString() : String {
		var flags : String = "";
		if(brokenBoot){
			flags = flags + ";BROKENBOOT";
		}
		return flags;
	}

	function interruptOverload(){
		overloading = false;
		OSCHandler.Instance.RevertClientScreen("PilotStation");			
		OSCHandler.Instance.RevertClientScreen("TacticalStation");			
		OSCHandler.Instance.RevertClientScreen("EngineerStation");	
		OSCHandler.Instance.RevertClientScreen("CommsStation");		
		//AudioSource.PlayClipAtPoint(destructAbort, transform.position);
		CabinEffects.Instance().QueueVoiceOver(destructAbort, 0);
		
	}
	
	/** overload the reactor */
	function reactorOverload(){
		reactorOverload(60);
	}
	
	function reactorOverload(seconds : int){
		if(!overloading){
			overloading = true;
			overloadStart = Time.fixedTime;
			//AudioSource.PlayClipAtPoint(destructStart, transform.position);
			CabinEffects.Instance().QueueVoiceOver(destructStart, 0);
			
			overloadTime = seconds;
			
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "selfdestruct");			//give the pilot a radar
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "selfdestruct");		//give the tactical a weapons screen
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "selfdestruct");			//give the engineer power man console
			OSCHandler.Instance.ChangeClientScreen("CommsStation", "selfdestruct");			//give the engineer power man console
			
			
			lastSecondCounter = 0;
			
		}
	}
	
	function reactorFailure(){
		if(systemEnabled == true){
			systemEnabled = false;
			soundSource.Stop();
			soundSource.pitch = 1.0;
			soundSource.clip =  failSound;
			soundSource.loop = false;
			//soundSource.Play();
			
			CabinEffects.Instance().QueueVoiceOver(failSound);
			
			var msg : OSCMessage = OSCMessage("/ship/damage");
			OSCHandler.Instance.SendMessageToAll(msg);		
			yield WaitForSeconds(1.5);
			
			//var msg : OSCMessage = OSCMessage("/reactor/failed");		
			msg  = OSCMessage("/system/reactor/stateUpdate");		
			msg.Append.<int>( 0 );		
			msg.Append.<String>( generateFlagString() );									
			OSCHandler.Instance.SendMessageToAll(msg);
			setSubsystemState(false);
			
		}
	}
	
	function playWarning(warningId : int){
		if(warningId == 0){
			AudioSource.PlayClipAtPoint(warningClips[0], transform.position);
		} else if(warningId == 1){
			AudioSource.PlayClipAtPoint(warningClips[1], transform.position);
			yield WaitForSeconds(warningClips[1].length + 0.5);
			reactorFailure();
		} else if(warningId == 2){
			AudioSource.PlayClipAtPoint(warningClips[2], transform.position);
			yield WaitForSeconds(warningClips[2].length + 0.8);
			reactorOverload();
		}
	}
		
	//actually turn off all subsystems in the ship
	function setSubsystemState(state : boolean){
		if(state == true){
			theShip.GetComponent.<PropulsionSystem>().enableSystem();
			theShip.GetComponent.<JumpSystem>().enableSystem();
		} else {
			theShip.GetComponent.<PropulsionSystem>().disableSystem();
			theShip.GetComponent.<JumpSystem>().disableSystem();

		}
	}
	
	/* this should spool up too*/
	
	function enableSystem(){
		if (systemEnabled == false){
	
			soundSource.clip = spoolSound;
			soundSource.pitch = 1.0;
			soundSource.Play();
			yield WaitForSeconds(spoolSound.length);
			systemEnabled = true;
			soundSource.clip = runningSound;
			soundSource.loop = true;
			soundSource.Play();
			if(firstStart == true){
				firstStart = false;
				//AudioSource.PlayClipAtPoint(firstTimeSound, transform.position);
			}
		
			var msg : OSCMessage = OSCMessage("/system/reactor/stateUpdate");		
			msg.Append.<int>( 1 );			
			msg.Append.<String>( generateFlagString() ); //
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	function disableSystem(){
		if(systemEnabled == true){
			systemEnabled = false;
			soundSource.Stop();
			soundSource.clip = stopSound;
			soundSource.loop = false;
			soundSource.Play();
			systemEnabled = false;
			var msg : OSCMessage = OSCMessage("/system/reactor/stateUpdate");		
			msg.Append.<int>( 0 );
			msg.Append.<String>( generateFlagString() );			
			OSCHandler.Instance.SendMessageToAll(msg);
			setSubsystemState(false);
			
		}
	}
	
	function FixedUpdate(){
		if(systemEnabled){
			if (currentEnergy + (generationRate * damage) < maxEnergy){
				currentEnergy += (generationRate * damage);
			} else {
				currentEnergy = maxEnergy;
			}
			soundSource.pitch = 1.0 + (currentEnergy / maxEnergy) * 0.3;
		}
		
		if(overloading){
			var t : int = overloadStart + overloadTime - Time.fixedTime ;
			if(lastSecondCounter != t){
				var msg : OSCMessage = OSCMessage("/system/reactor/overloadstate");
				msg.Append.<int>(t);	//time to explosion
				OSCHandler.Instance.SendMessageToAll(msg);
				if(t < 10){
					if(t == 5){
						soundSource.Stop();
						soundSource.clip = overloadSound;
						soundSource.pitch = 1.0;
						soundSource.Play();
					}
					lastSecondCounter = t;
					theShip.GetComponent.<DistanceSpeaker>().SpeakDistance(t, 1, false);
						
					if(t == 0){
						theShip.GetComponent.<ship>().damageShip(1000, "Self destructed");
					}
				}
			}
		}
		
	}
	
	function Update () {
	
	}
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		if(operation == "setstate"){				//turn this subsystem on or off
				if (message.Data[0]  == 0){
				
					disableSystem();
					
				} else {
					
					enableSystem();
					
				}
		} else if(operation == "fail"){
			reactorFailure();
			
		} else if (operation == "switchState"){
			var v : int = message.Data[0];
			reactorState(v);
			
		} else if (operation == "silliness"){
			var b : int = message.Data[0];
			playWarning(b);
			
		} else if (operation == "overload"){
			reactorOverload();
		} else if (operation == "overloadinterrupt"){
			interruptOverload();
			
			
		}
	}
	
	
	
}