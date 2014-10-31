#pragma strict

import UnityOSC;

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
	
	
	public var waitingForFuelLeak : boolean = false;
	public var fuelLeaking : boolean = false;
	public var fuelLeakHealth :float = 1.0f;
	
	
	
	
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
	
	
	
	

	function interruptOverload(){
		if(overloading){
			overloading = false;
			OSCHandler.Instance.RevertClientScreen("PilotStation", "selfdestruct");			
			OSCHandler.Instance.RevertClientScreen("TacticalStation", "selfdestruct");			
			OSCHandler.Instance.RevertClientScreen("EngineerStation", "selfdestruct");	
			OSCHandler.Instance.RevertClientScreen("CommsStation", "selfdestruct");		
			//AudioSource.PlayClipAtPoint(destructAbort, transform.position);
			CabinEffects.Instance().QueueVoiceOver(destructAbort, 0);
		}	
		
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
			
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "selfdestruct", true);			
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "selfdestruct",true);		
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "selfdestruct", true);			
			OSCHandler.Instance.ChangeClientScreen("CommsStation", "selfdestruct", true);			
			
			
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
			msg.Append.<String>( " " );									
			OSCHandler.Instance.SendMessageToAll(msg);
			setSubsystemState(false);
			
		}
	}
	
	function playWarning(warningId : int){
		if(warningId == 0){
			//AudioSource.PlayClipAtPoint(warningClips[0], transform.position);
		} else if(warningId == 1){
			//AudioSource.PlayClipAtPoint(warningClips[1], transform.position);
			yield WaitForSeconds(warningClips[1].length + 0.5);
			reactorFailure();
		} else if(warningId == 2){
			//AudioSource.PlayClipAtPoint(warningClips[2], transform.position);
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
			msg.Append.<String>( " "); //
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
			msg.Append.<String>( " " );			
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
						theShip.GetComponent.<ShipCore>().damageShip(1000, "Self destructed");
					}
				}
			}
		}
		
	}
	//fuel leak handling
	
	function setLeakFlagState(state : boolean){
		if(fuelLeaking == true && state == false){
			//fuel is leaking and we GM cancelled it
			
			waitingForFuelLeak = false;
			fuelLeaking	= false;
			//send a banner message to the players to say the leak stopped
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Repair complete", "Fuel leak stabilised", 4000);
			return;
		}
		//otherwise set the flag state
		waitingForFuelLeak = state;
		
			
	}
	
	/* ran out of fuel, shut the ship down, wait a few moments and then end the game */
	function outOfFuel(){
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "CRITICAL", "FUEL TANKS EMPTY", 4000);
		yield WaitForSeconds(4);
		reactorFailure();
		yield WaitForSeconds(5);
		
		GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead("Ran out of fuel");
	}
	
	function damageReactor(){
		if(waitingForFuelLeak){
			
			fuelLeaking = true;
			waitingForFuelLeak = false;
			
			//send out banner message
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "WARNING", "FUEL LEAK DETECTED", 4000);
			//tell the engineer station to start leaking fuel
			var msg : OSCMessage = new OSCMessage("/system/fuelLeakState");
			msg.Append(1);
			OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
			
			
		}
	}
	
	function repairReactor(amt: float){
		if(fuelLeaking){
			fuelLeakHealth -= amt;
			if(fuelLeakHealth < 0.0f){
				fuelLeaking = false;
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Repair complete", "Fuel leak stabilised", 4000);
				//tell the engineer station to start leaking fuel
				var msg : OSCMessage = new OSCMessage("/system/fuelLeakState");
				msg.Append(0);
				OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
			}
		}
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
			
		} else if (operation == "silliness"){
			var b : int = message.Data[0];
			playWarning(b);
			
		} else if (operation == "overload"){
			reactorOverload();
		} else if (operation == "overloadinterrupt"){
			interruptOverload();
		} else if (operation == "setFuelLeakFlag"){
			var state :boolean = message.Data[0] == 1 ? true : false;
			setLeakFlagState(state);
		} else if (operation == "outOfFuel"){
			outOfFuel();
				
			
		}
	}
	
	
	
}