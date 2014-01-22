#pragma strict


class TransporterSystem extends BaseSubsystem implements JammingListener {
	
	
	
	var ejectedDudePrefab : Transform;
	var airlockDumpSfx : AudioClip;
	
	var startBeamTime : float;	
	var maxBeamTime : float; 
	
	private var beamInProgress : boolean = false;
	private var beamEnabled : boolean = false;
	
	private var beamFailed : boolean = false;
	
	
	function Start () {
		super.Start();
	}
	
	function Update () {
	
	}
	
	
	
	function jammingResult(state : int){
		Debug.Log("cb");
		if(state == 0){	//failed to jam
//			AudioSource.PlayClipAtPoint(beamInSfx, theShip.transform.position);
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER DETECTED IN TRANSPORTER ROOM, PREPARE TO DUMP AIRLOCK CONTENTS", 1500);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "airlockdump");
		} else if (state == 1){
			//beam was stopped. All consoles see this message
			//anyway and will revert to their normal function
			//AudioSource.PlayClipAtPoint(beamFailSfx, theShip.transform.position);
			//yield WaitForSeconds(2);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");
		}
	}
	
	function startBeamAttempt(){
		beamInProgress = true;
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "SOMEONE IS TRYING TO BEAM ABOARD, PREPARE TO JAM THE SIGNAL", 2000);
		yield WaitForSeconds(1);
		theShip.GetComponent.<JammingSystem>().startJammer( this);
		

		
	}
	
	function beamAttemptResult(res : int){
	
		Debug.Log("beam attempt result " + res);
		if(res == 0){
			//play a beam aboard sound
			//consoles will display an intruder alert warning
			/*AudioSource.PlayClipAtPoint(beamInSfx, theShip.transform.position);
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER DETECTED IN TRANSPORTER ROOM, PREPARE TO DUMP AIRLOCK CONTENTS", 1500);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "airlockdump");*/
		} else if (res == 1){
			//beam was stopped. All consoles see this message
			//anyway and will revert to their normal function
			/*AudioSource.PlayClipAtPoint(beamFailSfx, theShip.transform.position);
			yield WaitForSeconds(2);
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");*/
		} else if( res == 2){
			if(beamFailed == false){
			
				OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INTRUDER HAS DISABLED AIRLOCK DOOR, PREPARE FOR BOARDING", 10000);
				beamFailed = true;
				//schedule a light cutout and death
				yield WaitForSeconds(5);
				GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().shipDead("Killed by alien invaders");
			}
			
		} else if (res == 3){
			if(beamFailed == false){
	
				//airlock dumped, play door/hiss sound
				//spawn a an alien flying out of ship
				//AudioSource.PlayClipAtPoint(airlockDumpSfx, theShip.transform.position);
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "DUMPING AIRLOCK CONTENTS..", 2000);
				yield WaitForSeconds(1.6);
				Instantiate(ejectedDudePrefab, theShip.transform.position, theShip.transform.rotation);
				OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");
				//switch engineer back to power
				
			}
			
			
			
		}
	}
	
	
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var target = msgAddress[3];
		switch (target){
			case "startBeamAttempt":
				startBeamAttempt();			
				break;
			case "beamAttemptResult":
				
				beamAttemptResult(message.Data[0]);
					
				
				break;
				
		}
		
		
	}
	
}