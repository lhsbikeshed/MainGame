#pragma strict
class ShieldSubsystem extends BaseSubsystem
{

	var shieldLevel : float = 0.0;	//percentage of shield remaining
	var rechargeRate : float = 0.1;

	var shieldsEnabled : boolean;	//are the shields actually on? The subsystem can be on but shields off

	private var shieldObject : Transform;
	
	var toggle : boolean = false;
	
	private var flashTime : long;	//time a shield flash should start
	private var flashLength :float =  0.5f;
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
		
		
		flicker(1.0f);
	
	}
	
	
	function turnOff(){
		shieldsEnabled = false;
		
		flashTime = Time.fixedTime;
		shieldRenderer.material.color.a = 1.0;
		
		
	}
	
	function flicker (length : float){
		flashLength = length;
		flashTime = Time.fixedTime;
		shieldRenderer.material.color.a = 1.0;	
	}
	
	
	/* this should drop the shield down and also return a 0-1.0 modifier thats then used
	 * to calculate the damage passed through the shield to the hull
	 * for now just block all damage through the shield
	 * if the damage to the shield causes it to hit 0 then start a timer to bring it back online
	 */
	function gotHit(damage : float) : float{
		if(shieldsEnabled){
			flicker(0.5f);
			return 0.0;
		} else {
			return 1.0;
		}
	}
	
	function FixedUpdate () {
		if(toggle){
			toggle = false;
			if(shieldsEnabled){
				turnOff();
			} else {
				turnOn();
			}
		}
	
		if(systemEnabled){
			
			if(shieldsEnabled){
				shieldLevel += rechargeRate * powerState  ;
				if (shieldLevel > 100){
					shieldLevel = 100;
				}
			} else {
				shieldLevel -= 0.05f;
				if(shieldLevel < 0.0f){
					shieldLevel = 0.0f;
				}
			}
			
				
		} else {		//we ran out of power or system is off
			shieldLevel = 0;
		}
		
		
		if (flashTime + flashLength > Time.fixedTime){
			shieldRenderer.material.color.a = 1.0 - ((Time.fixedTime - flashTime) * 2.0);
			shieldRenderer.material.SetTextureOffset("_MainTex", Vector2( 0, 1.0 - ((Time.fixedTime - flashTime) * 2.0)));
		} else {
			shieldRenderer.material.color.a = 0.0f;
		}
			
	}

}