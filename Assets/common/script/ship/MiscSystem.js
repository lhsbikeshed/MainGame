#pragma strict

/* Miscecllaneous systems
 *
 * for example: ships light, cabin lights, air con :p
 */

class MiscSystem extends BaseSubsystem
{

	private var shipsLight : Light;
	var leaking : boolean = false;
	var consuming : boolean = false;
	var consumptionRate : float = 0.002;
	
	var oxygenLevel : float = 100.0f;
	private var expOverlay : ExplosionOverlayBehaviour;
	var dockingClamp : UndercarriageBehaviour;
	
	function Start () {
		super();
		shipsLight = theShip.GetComponentInChildren(Light);
		shipsLight.intensity = 0.0f;
		disableSystem();
		expOverlay = theShip.GetComponent	.<ExplosionOverlayBehaviour>();
	}
	
	function enableSystem(){
		if(systemEnabled == false){
			systemEnabled = true;
			powerState = 1.0;
			
		}
	}
	
	function disableSystem(){
		if(systemEnabled){
			systemEnabled = false;	
			powerState = 0.0;	
			energyConsumptionRate = 0.0;
			setExternalLight(false);
		}
	}
	
	function setExternalLight(state : boolean){
		//if(systemEnabled == false ){ return; }
		if(state == true){
			shipsLight.intensity = 0.6f;
			energyConsumptionRate += 1f;
		} else {
			if(shipsLight != null){
				shipsLight.intensity = 0.0f;
			}
			energyConsumptionRate -= 1f;
		}
	}
		
	function FixedUpdate () {
		if(systemEnabled){
			
			
		} 
		if(consuming){
			oxygenLevel -= consumptionRate;
			var oxProductionRate = UsefulShit.map(theShip.GetComponent.<ShipCore>().getInternalPower(), 0f, 12f, 0f, 0.01f);
			oxygenLevel += oxProductionRate;
		}
		if(leaking){
			oxygenLevel -= 0.003;
		}
		oxygenLevel = Mathf.Clamp(oxygenLevel, 0, 100);
		if(oxygenLevel < 15.0f && oxygenLevel >= 0.01f){
			var rate : float = map(oxygenLevel, 15, 0, 1, 3);
			expOverlay.setHeartRate(rate);
			
		} else {
			expOverlay.setHeartRate(0.0);
		}
		
		if(oxygenLevel <= 0.0f){
			GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead("suffocated by lack of air");
		}
		
		
	}
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		
		
		
		
		if( operation == "extlight"){
			var state: boolean = message.Data[0] == 1 ? true : false; 
			setExternalLight(state);
		} else if (operation == "blastShield"){
			var doorState: boolean = message.Data[0] == 1 ? false : true; 
			theShip.GetComponent.<ShipCore>().setShutterState(doorState);
			Debug.Log("aids");
		
		
			
		}
	}
}


function map(x : float, in_min : float, in_max : float, out_min : float, out_max : float) : float
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}