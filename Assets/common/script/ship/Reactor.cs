using UnityEngine;
using System;
using UnityOSC;
using System.Collections;

/* reactor generates energy
 * power ship on/off
 * track fuel usage
 * 
 */

public delegate void ReactorStateChange(bool newState);


[System.Serializable]
public class Reactor: MonoBehaviour{

	//delegates
	public event ReactorStateChange reactorStateChange;

	public float generationRate = 1.0f;		//rate at which we generate energy
	public float currentEnergy = 500.0f;
	public float maxEnergy = 2000.0f;
	public float damage = 1.0f;				//percentage fuckedness

	//=------- fuel handling ------------
	public int[] fuelTankLevel = {1000,1000,1000}; //0 for main, 1 and 2 as aux
	public static readonly int FUEL_FUCKED = 2;
	public static readonly int FUEL_CONNECTED = 1;
	public static readonly int FUEL_DISCONNECTED = 0;	
	public int fuelLineConnectionState = FUEL_DISCONNECTED;


	//------------ reactor state--------
	public bool systemEnabled;

	public AudioClip spoolSound;
	public AudioClip stopSound;
	public AudioClip runningSound;
	public AudioClip failSound;

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
			reactorStateChange(false);
		}
		OSCMessage msg2 = new OSCMessage("/ship/state/setFuelConnectionState");
		msg2.Append(FUEL_DISCONNECTED);
		OSCHandler.Instance.SendMessageToClient("EngineerStation", msg2);
	}

	//------------ fuel handling --------
	void setFuelConnectionState (int v)
	{
		fuelLineConnectionState = v;
		
	}
	/* called from a landing pad when the ship has docked to it */
	public void dockStateChange(bool state){
		if (state) {
			OSCHandler.Instance.ChangeClientScreen ("EngineerStation", "refuelDisplay");
			//TODO send a docking port offset to make the game harder depending on accuracy of
			//the pilot
			OSCMessage msg = new OSCMessage("/screen/refuelDisplay/resetParams");
			OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
		} else {
			
			//check to see if the fuel line is connected.
			if(fuelLineConnectionState == FUEL_CONNECTED){
				OSCMessage msg = new OSCMessage("/ship/state/setFuelConnectionState");
				msg.Append(FUEL_FUCKED);
				OSCHandler.Instance.SendMessageToClient("EngineerStation", msg);
				fuelLineConnectionState = FUEL_FUCKED;
				
				//wait a few seconds then switch to power
				StartCoroutine(changeScreenAfterABit());
			} else {
				OSCHandler.Instance.ChangeClientScreen ("EngineerStation", "power");
			}
		}
	}
	IEnumerator changeScreenAfterABit(){
		yield return new WaitForSeconds(4);
		OSCHandler.Instance.ChangeClientScreen ("EngineerStation", "power");
	}

	//------------- reactor overloading ---------------
	
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
			reactorStateChange(true);
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
			reactorStateChange(false);
			
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


	
	public void damageReactor(){

	}
	
	public void repairReactor(float amt){

	}
	
	public void processOSCMessage(OSCMessage message){
		string[] msgAddress = message.Address.Split('/');
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
		} else if (operation == "setFuelConnectionState") {
			int v = (int)message.Data[0];
			setFuelConnectionState(v);
			
		}
	}
	
	
	
}
