using UnityEngine;
using System;
using System.Collections.Generic;
using UnityOSC;

[System.Serializable]
public class BaseSubsystem: MonoBehaviour
{
	public bool systemEnabled;			//is this thing still working?
	public float energyConsumptionRate;	//energy consumed per update at 100% power
	public float powerState;				//how much power are we putting here?
	public float maxPowerState = 1.0f;	//max percentage we can push this system to. This can also go down due to damage
	//var energyInSystem : float = 0.0;	//how much energy is in this system
	//var maxEnergyInSystem : float = 100;	//max amount we can have
	
	public float damage;			//percentage were damaged
	
	
	protected char[] separator = new char[]{'/'};

	protected GameObject theShip;	//reference to the ship
	protected Reactor reactor;
	
	protected OSCSystem oscSender;
	
	protected List<SystemRequirement> requirementList;
	
	public virtual void Awake(){
		requirementList = new System.Collections.Generic.List<SystemRequirement>();
	}

	public virtual void Start() {
		theShip = GameObject.Find("TheShip");
		reactor = theShip.GetComponent<Reactor>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent<OSCSystem>();
	
	}
	
	/* add a requirement for this system to function */
	public void addRequirement(SystemRequirement req){
		if(requirementList.Contains(req) == false){
			requirementList.Add(req);
		}
	}
	/* remove a requirement */
	public void removeRequirement(SystemRequirement req){
		if(requirementList.Contains(req) == true){
			requirementList.Remove(req);
		}
	}
	
	public void removeRequirement(string tag){
		SystemRequirement r = new SystemRequirement(tag, "dont care");
		removeRequirement(r);
	}
	
	/* can this system be used? i.e. have all the requirements been removed?
	*/
	public bool canBeUsed(){
		return requirementList.Count == 0;
	}
	
	/* generate some text to send to the client to explain why this isnt working */
	public string getRequirementString() {
		string retString = "";
		foreach(SystemRequirement s in requirementList){
			retString += "> " + s.clientText + "\r\n";
			
		
		}
		return retString;
	}
	
	
	
	//apply damage based on velocity
	public void applyImpactDamage(float force){}
	
	public virtual void repair(float amount){
	}
	
	public virtual void enableSystem(){
	}
	
	public virtual void disableSystem(){
	}


	public virtual void processOSCMessage(OSCMessage message){
	
	}
	
}


