#pragma strict


class BaseSubsystem extends MonoBehaviour
{
	var systemEnabled : boolean;			//is this thing still working?
	var energyConsumptionRate : float;	//energy consumed per update at 100% power
	var powerState : float;				//how much power are we putting here?
	var maxPowerState : float = 1.0f;	//max percentage we can push this system to. This can also go down due to damage
	//var energyInSystem : float = 0.0;	//how much energy is in this system
	//var maxEnergyInSystem : float = 100;	//max amount we can have
	
	var damage : float;			//percentage were damaged
	
	
	protected var separator : char[] = ["/"[0]];

	protected var theShip : GameObject;	//reference to the ship
	protected var reactor : Reactor;
	
	protected var oscSender : OSCSystem;
	

	function Start () {
		theShip = GameObject.Find("TheShip");
		reactor = theShip.GetComponent.<Reactor>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent.<OSCSystem>();

	}
	
	//apply damage based on velocity
	function applyImpactDamage(force : float){}
	
	function repair(amount : float){
	}
	
	function enableSystem(){
	}
	
	function disableSystem(){
	}


	function processOSCMessage(message : OSCMessage){
	
	}
	
}

