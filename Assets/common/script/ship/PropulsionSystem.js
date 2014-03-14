#pragma strict

/* should this class spawn two engine colliders?
*/
class PropulsionSystem extends BaseSubsystem
{
	
	var propulsionModifier : float; //how much we modify the actual throttle on the ship
	var propulsionOffset : Vector3; //on damage we should vector the thrust
	
	
	var throttleDisabled : boolean = true;
	var rotationDisabled : boolean = true;
	var throttle : float = 0.0f;
	
	var inBay : boolean = false;
	
	var propulsionPowerModifier : float[];
	
	var engineParticles : ParticleSystem;
	var particleRate : AnimationCurve;
	var baseEmissionRate : float;
	var engineLight : Light;
	
	
	function Start(){
		super.Start();
		propulsionPowerModifier = new float[3];
		propulsionPowerModifier[0] = 0.2f;
		propulsionPowerModifier[1] = 0.5f;
		propulsionPowerModifier[2] = 1.0f;
	}
	
	function Awake(){
		theShip = GameObject.Find("TheShip");
	}
	
	function disableSystem(){
		systemEnabled = false;
		
		theShip.rigidbody.drag = 0.0f;
		propulsionModifier = 0.0f;
		throttleDisabled = true;
		rotationDisabled = true;
		engineParticles.enableEmission = false;
	}
	
	function enableSystem(){
		systemEnabled = true;
		theShip.rigidbody.drag = 0.5f;
		throttleDisabled = false;
		rotationDisabled = false;
		engineParticles.enableEmission = true;
		engineParticles.emissionRate = baseEmissionRate * particleRate.Evaluate(throttle);
		engineParticles.startSpeed = -baseEmissionRate * particleRate.Evaluate(throttle);
		
		
	}
	
	function FixedUpdate () {
		
		if(systemEnabled){
			
			var power : float = reactor.consumePower(energyConsumptionRate * powerState);
			if(power < energyConsumptionRate * powerState) {	//we didnt get what we wanted for xmas...
				disableSystem();
			}
			propulsionModifier = power / (energyConsumptionRate * maxPowerState);
			
			engineParticles.emissionRate = 380.0f * particleRate.Evaluate(throttle);
			engineParticles.startSpeed = -1.14f * particleRate.Evaluate(throttle);
			engineLight.intensity = 9.0f * particleRate.Evaluate(throttle);
		} 
		propulsionModifier = propulsionPowerModifier[theShip.GetComponent.<ship>().propulsionPower - 1]; //(1 + theShip.GetComponent.<ship>().propulsionPower) / 4.0f;
		if(inBay){
			propulsionModifier *= 0.5f;
		}
		//on damage to left and right engines we should return some sort of direction for the ship to move in
		//to simulate engines being borked
	}
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var operation = msgAddress[3];
		
		if (operation == "state"){					//propulsion enable
				if (message.Data[0] == 0){
					disableSystem();
				} else {
					enableSystem();
				}
		} /*else if (operation == "throttle"){
			var throttle : float = message.Data[0] ;
			scaledThrottle =  throttle;
		}*/
	}
	
	
}