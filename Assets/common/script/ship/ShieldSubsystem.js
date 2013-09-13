#pragma strict
class ShieldSubsystem extends BaseSubsystem
{

	var shieldLevel : float = 0.0;	//percentage of shield remaining
	var rechargeRate : float = 0.1;

	var shieldsEnabled : boolean;	//are the shields actually on? The subsystem can be on but shields off

	private var shieldObject : Transform;
	
	private var flashTime : long;	//time a shield flash should start
	private var shieldRenderer : Renderer;

	function Start () {
		super();
		shieldObject = transform.Find("Shield");
		shieldRenderer = shieldObject.GetComponent.<Renderer>();
		turnOff();
	
	}
	
	function turnOn(){	
		//check system has enough energy to start
		shieldsEnabled = true;
		flashTime = Time.fixedTime;
		shieldObject.collider.enabled = true;
		shieldRenderer.material.color.a = 1.0;	
	
	}
	
	function damageShield( amount : float){
		flashTime = Time.fixedTime;
		
		if(shieldLevel - amount < 0){
			shieldLevel = 0;
			turnOff();
			damage -= 0.1;
		} else {
			shieldLevel -= amount;
		}
		
	}
	
	function turnOff(){
		shieldsEnabled = false;
		shieldObject.collider.enabled = false;
		flashTime = Time.fixedTime;
		shieldRenderer.material.color.a = 1.0;
		
	}
	
	function OnCollisionEnter(c : Collision){
		if (shieldsEnabled){
			flashTime = Time.fixedTime;
			Debug.Log(c.impactForceSum.magnitude);
			damageShield(c.impactForceSum.magnitude);

		}
	}
	
	function FixedUpdate () {
		if(systemEnabled){
				
			var power : float = reactor.consumePower(energyConsumptionRate * powerState);
			if(power < energyConsumptionRate * powerState) {	//we didnt get what we wanted for xmas...
				systemEnabled = false;
			}
			
			shieldLevel += rechargeRate * powerState  * damage;
			if (shieldLevel > 100){
				shieldLevel = 100;
			}
			
				
		} else {		//we ran out of power or system is off
			shieldLevel = 0;
		}
		
		
		if (flashTime + 0.5f > Time.fixedTime){
			shieldRenderer.material.color.a = 1.0 - ((Time.fixedTime - flashTime) * 2.0);
			shieldRenderer.material.SetTextureOffset("_MainTex", Vector2( 0, 1.0 - ((Time.fixedTime - flashTime) * 2.0)));
		} else {
			shieldRenderer.material.color.a = 0.0f;
		}
			
	}

}