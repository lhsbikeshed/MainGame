#pragma strict
class JumpSystem extends BaseSubsystem
{

	var jumpChargePercent : float;	//0->1 of how charged system is
	var canJump : boolean;			//can we jump
	var chargeRate : float;			//to tweak jump charge rates
	var jumpNodeFrequency : int;	//"frequency" of the jump node were using. If this doesnt match the node then
									//NO JUMPY

	private var soundSource : AudioSource;
	var chargeSound : AudioClip;
	var openSound : AudioClip;
	var initialisedSound : AudioClip;
	private var discharging : boolean = false;

	
	function Start () {
		super();
		soundSource = gameObject.AddComponent("AudioSource");
		soundSource.pitch = 1.0;
		soundSource.clip = chargeSound;
		
	}
	
	
	function repair(amount : float){
	}
	
	function go(){
		soundSource.Stop();
		soundSource.pitch = 1.0;
		soundSource.clip = openSound;
		soundSource.Play();
		AudioSource.PlayClipAtPoint(initialisedSound, transform.position);
	
	}
	
	function openSoundStart(){
		if(soundSource.isPlaying){
			return;
		}
		soundSource.pitch = 1.0;
		soundSource.clip = openSound;
		soundSource.Play();
		
	}
	
	function abort(){
		soundSource.Stop();
	}
	
	function doJump(){
		
		
		disableSystem();
	}
	
	function enableSystem(){
		if(systemEnabled == false){
			systemEnabled = true;
			
			soundSource.loop = true;
			soundSource.clip = chargeSound;

			soundSource.Play();
			discharging = false;
		}
	}
	
	function disableSystem(){
		if(systemEnabled){
			canJump = false;
			systemEnabled = false;
			//0jumpChargePercent = 0.0;
			//soundSource.Stop();
			discharging = true;
			canJump = false;
			theShip.GetComponent.<ship>().updateJumpStatus();
		}
	}
	
	function FixedUpdate () {
		if(systemEnabled){
				
			
			
				jumpChargePercent += (chargeRate * damage * powerState) / 100.0f;
				if(jumpChargePercent >= 1.0){
					jumpChargePercent = 1.0;
					canJump = true;
					theShip.GetComponent.<ship>().updateJumpStatus();

				} else {
					canJump = false;
					theShip.GetComponent.<ship>().updateJumpStatus();
				}
				soundSource.pitch = jumpChargePercent;
			
		} 
		if(discharging){
			jumpChargePercent -= 0.01;
			soundSource.pitch = jumpChargePercent;
			if(jumpChargePercent <= 0){
				jumpChargePercent = 0;
				discharging = false;
				soundSource.Stop();
			}
		}
	
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
		} else if(operation == "doJump"){
			theShip.GetComponent.<ship>().startJump();
		} else if (operation ==  "startJump"){
			theShip.GetComponent.<ship>().startJump();
		}
			
			
	}
}