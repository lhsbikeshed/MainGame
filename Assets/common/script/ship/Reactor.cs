using UnityEngine;
using System;
using UnityOSC;
using System.Collections;

/* reactor generates energy
 * also its the control class for all subsystems
 */
[System.Serializable]
public class Reactor: MonoBehaviour{
	
	public float generationRate = 1.0f;		//rate at which we generate energy
	public float currentEnergy = 500.0f;
	public float maxEnergy = 2000.0f;
	public float damage = 1.0f;				//percentage fuckedness
	public bool brokenBoot = false;		//is the next bootup broken?
	
	public bool systemEnabled;
	public bool runningQuiet = false;
	public AudioClip spoolSound;
	public AudioClip stopSound;
	public AudioClip runningSound;
	public AudioClip failSound;
	public AudioClip[] startupSounds;
	public AudioClip firstTimeSound;
	
	public AudioClip[] warningClips;
	
	bool firstStart = true;
	GameObject theShip;
	
	BaseSubsystem[] subsystems;
	AudioSource soundSource;
	AudioSource speechSource;
	
	
	public AudioClip destructStart;
	public AudioClip destructAbort;
	public AudioClip overloadSound;
	public int overloadTime = 60;
	float overloadStart;
	 public bool overloading;
	int lastSecondCounter = 0;
	
	char[] separator = new char[]{'/'};
	
	
	public bool waitingForFuelLeak = false;
	public bool fuelLeaking = false;
	public float fuelLeakHealth = 1.0f;
	
	
	
	
	/*
	* Reactor produces energy for subsystems
	*/
	public void Start() {
		theShip = GameObject.Find("TheShip");
		soundSource = gameObject.AddComponent<AudioSource>();
		speechSource = gameObject.AddComponent<AudioSource>();
		if(systemEnabled ==  false){
			OSCMessage msg = new OSCMessage("/system/reactor/stateUpdate");		
			msg.Append<int>( 0 );			
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	public bool isOverloading() {
		return overloading;
	}
	
	/* Consume some power
	 * if at the next update this would consume our energy
	 * then return amount given
	 * subsystems should then NOT turn on
	 */
	public float consumePower(float amount)
	{
		
		if (currentEnergy - amount >= 0.0f){
			currentEnergy -= amount;
			return amount;
		} else {
			float ret = currentEnergy;
			currentEnergy = 0.0f;
			disableSystem();	//actually need to broadcast a "shut everything off" message here to power off lights etc
			return ret;
		}
	}
	
	
	
	

	public void interruptOverload(){
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
	public void reactorOverload(){
		reactorOverload(60);
	}
	
	public void reactorOverload(int seconds){
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
	
	public IEnumerator reactorFailure(){
		if(systemEnabled == true){
			systemEnabled = false;
			soundSource.Stop();
			soundSource.pitch = 1.0f;
			soundSource.clip =  failSound;
			soundSource.loop = false;
			//soundSource.Play();
			
			CabinEffects.Instance().QueueVoiceOver(failSound);
			
			OSCMessage msg = new OSCMessage("/ship/damage");
			OSCHandler.Instance.SendMessageToAll(msg);		
			yield return new WaitForSeconds(1.5f);
			
			//var msg : OSCMessage = OSCMessage("/reactor/failed");		
			msg  = new OSCMessage("/system/reactor/stateUpdate");		
			msg.Append<int>( 0 );		
			msg.Append<String>( " " );									
			OSCHandler.Instance.SendMessageToAll(msg);
			setSubsystemState(false);
			
		}
	}
	
	public IEnumerator playWarning(int warningId){
		if(warningId == 0){
			//AudioSource.PlayClipAtPoint(warningClips[0], transform.position);
		} else if(warningId == 1){
			//AudioSource.PlayClipAtPoint(warningClips[1], transform.position);
			yield return new WaitForSeconds(warningClips[1].length + 0.5f);
			StartCoroutine(reactorFailure());
		} else if(warningId == 2){
			//AudioSource.PlayClipAtPoint(warningClips[2], transform.position);
			yield return new WaitForSeconds(warningClips[2].length + 0.8f);
			reactorOverload();
		}
	}
		
	//actually turn off all subsystems in the ship
	public void setSubsystemState(bool state){
		if(state == true){
			theShip.GetComponent<PropulsionSystem>().enableSystem();
			theShip.GetComponent<JumpSystem>().enableSystem();
		} else {
			theShip.GetComponent<PropulsionSystem>().disableSystem();
			theShip.GetComponent<JumpSystem>().disableSystem();

		}
	}
	
	/* this should spool up too*/
	
	public IEnumerator enableSystem(){
		if (systemEnabled == false){
	
			soundSource.clip = spoolSound;
			soundSource.pitch = 1.0f;
			soundSource.Play();
			yield return new WaitForSeconds(spoolSound.length);
			systemEnabled = true;
			soundSource.clip = runningSound;
			soundSource.loop = true;
			soundSource.Play();
			if(firstStart == true){
				firstStart = false;
				//AudioSource.PlayClipAtPoint(firstTimeSound, transform.position);
			}
		
			OSCMessage msg = new OSCMessage("/system/reactor/stateUpdate");		
			msg.Append<int>( 1 );			
			msg.Append<String>( " "); //
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	}
	
	public void disableSystem(){
		if(systemEnabled == true){
			systemEnabled = false;
			soundSource.Stop();
			soundSource.clip = stopSound;
			soundSource.loop = false;
			soundSource.Play();
			systemEnabled = false;
			OSCMessage msg = new OSCMessage("/system/reactor/stateUpdate");		
			msg.Append<int>( 0 );
			msg.Append<String>( " " );			
			OSCHandler.Instance.SendMessageToAll(msg);
			setSubsystemState(false);
			
		}
	}
	
	public void FixedUpdate(){
		if(systemEnabled){
			if (currentEnergy + (generationRate * damage) < maxEnergy){
				currentEnergy += (generationRate * damage);
			} else {
				currentEnergy = maxEnergy;
			}
			soundSource.pitch = 1.0f + (currentEnergy / maxEnergy) * 0.3f;
		}
		
		if(overloading){
			int t = (int)(overloadStart + overloadTime - Time.fixedTime) ;
			if(lastSecondCounter != t){
				OSCMessage msg = new OSCMessage("/system/reactor/overloadstate");
				msg.Append<int>(t);	//time to explosion
				OSCHandler.Instance.SendMessageToAll(msg);
				if(t < 10){
					if(t == 5){
						soundSource.Stop();
						soundSource.clip = overloadSound;
						soundSource.pitch = 1.0f;
						soundSource.Play();
					}
					lastSecondCounter = t;
					StartCoroutine(theShip.GetComponent<DistanceSpeaker>().SpeakDistance((float)t, 1, false));
						
					if(t == 0){
						StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(1000.0f, "Self destructed"));
					}
				}
			}
		}
		
	}
	//fuel leak handling
	
	public void setLeakFlagState(bool state){
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
	public IEnumerator outOfFuel(){
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "CRITICAL", "FUEL TANKS EMPTY", 4000);
		yield return new WaitForSeconds(4.0f);
		StartCoroutine(reactorFailure());
		yield return new WaitForSeconds(5.0f);
		
		GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().shipDead("Ran out of fuel");
	}
	
	public void damageReactor(){
		if(waitingForFuelLeak){
			
			fuelLeaking = true;
			waitingForFuelLeak = false;
			
			//send out banner message
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "WARNING", "FUEL LEAK DETECTED", 4000);
			//tell the engineer station to start leaking fuel
			OSCMessage msg = new OSCMessage("/system/fuelLeakState");
			msg.Append(1);
			OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
			
			
		}
	}
	
	public void repairReactor(float amt){
		if(fuelLeaking){
			fuelLeakHealth -= amt;
			if(fuelLeakHealth < 0.0f){
				fuelLeaking = false;
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Repair complete", "Fuel leak stabilised", 4000);
				//tell the engineer station to start leaking fuel
				OSCMessage msg = new OSCMessage("/system/fuelLeakState");
				msg.Append(0);
				OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
			}
		}
	}
	
	public void processOSCMessage(OSCMessage message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		if(operation == "setstate"){				//turn this subsystem on or off
				if ((int)message.Data[0]  == 0){
				
					disableSystem();
					
				} else {
					
					StartCoroutine(enableSystem());
					
				}
		} else if(operation == "fail"){
			StartCoroutine(reactorFailure());
			
		} else if (operation == "silliness"){
			int b = (int)message.Data[0];
			StartCoroutine(playWarning(b));
			
		} else if (operation == "overload"){
			reactorOverload();
		} else if (operation == "overloadinterrupt"){
			interruptOverload();
		} else if (operation == "setFuelLeakFlag"){
			bool state = (int)message.Data[0] == 1 ? true : false;
			setLeakFlagState(state);
		} else if (operation == "outOfFuel"){
			StartCoroutine(outOfFuel());
				
			
		}
	}
	
	
	
}
