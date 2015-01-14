using UnityEngine;
using System;
using UnityOSC;

/* Miscecllaneous systems
 *
 * for example: ships light, cabin lights, air con :p
 */

[System.Serializable]
public class MiscSystem: BaseSubsystem
{

	Light shipsLight;
	public bool leaking = false;
	public bool consuming = false;
	public float consumptionRate = 0.002f;
	
	public float oxygenLevel = 100.0f;
	ExplosionOverlayBehaviour expOverlay;
	public UndercarriageBehaviour dockingClamp;
	
	public override void Start() {
			base.Start ();
		shipsLight = theShip.GetComponentInChildren<Light>();
		shipsLight.intensity = 0.0f;
		disableSystem();
		expOverlay = theShip.GetComponent<ExplosionOverlayBehaviour>();
	}
	
	public override void enableSystem(){
		if(systemEnabled == false){
			systemEnabled = true;
			powerState = 1.0f;
			
		}
	}
	
	public override void disableSystem(){
		if(systemEnabled){
			systemEnabled = false;	
			powerState = 0.0f;	
			energyConsumptionRate = 0.0f;
			setExternalLight(false);
		}
	}
	
	public void setExternalLight(bool state){
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
		
	public void FixedUpdate() {
		if(systemEnabled){
			
			
		} 
		if(consuming){
			oxygenLevel -= consumptionRate;
			float oxProductionRate = UsefulShit.map((float)theShip.GetComponent<ShipCore>().getInternalPower(), 0f, 12f, 0f, 0.01f);
			oxygenLevel += oxProductionRate;
		}
		if(leaking){
			oxygenLevel -= 0.003f;
		}
		oxygenLevel = (float)Mathf.Clamp((int)oxygenLevel, 0, 100);
		if(oxygenLevel < 15.0f && oxygenLevel >= 0.01f){
			float rate = map(oxygenLevel, 15.0f, 0.0f, 1.0f, 3.0f);
			expOverlay.setHeartRate(rate);
			
		} else {
			expOverlay.setHeartRate(0.0f);
		}
		
		if(oxygenLevel <= 0.0f){
			GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().shipDead("suffocated by lack of air");
		}
		
		
	}
	
	public override void processOSCMessage(OSCMessage message){
		String[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		String system = msgAddress[2];
		String operation = msgAddress[3];
		
		
		
		
		if( operation == "extlight"){
			bool state = (int)message.Data[0] == 1 ? true : false; 
			setExternalLight(state);
		} else if (operation == "blastShield"){
			bool doorState = (int)message.Data[0] == 1 ? false : true; 
			theShip.GetComponent<ShipCore>().setShutterState(doorState);
			UnityEngine.Debug.Log("aids");
		
		
			
		}
	}
		public float map(float x,float in_min,float in_max,float out_min,float out_max)
		{
			return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		}
}
