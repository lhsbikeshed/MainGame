#pragma strict



/* arrive
 * "oh were lost"
 * distress start
 * go look for ship
 * tell tactical to interrogate the ship and retrieve security cam footage (do a port knocking sequence?)
 * it plays the last moments of the ship and warning that theres a virus on board
 * infect ship with virus (spazzes out and causes self destruct to come on
 * OH CRAP REPAIR THE MAIN COMPUTER
 * instruct engineer to open computer and power off, replace the crystals and turn on
 * "file missing, insert disk XXX"
 * machine boots ( or has exploded by now) and virus clears
 * 
 */
RequireComponent( AudioSource);
 
class NebulaScene extends GenericScene {
	
	var lightningPrefab : Transform;
	var stormsEnabled : boolean = false;
	var stormRate : float = 10.0f;
	var strikeClip : AudioClip;
	
	var logSounds : AudioClip[];
	private var audioSource : AudioSource;
	
	//virus parts
	var infected : boolean = false;
	var infectedTime :float = 0;
	var disksRemaining : int = 3;
	private var triggeredOverload : boolean = false;
	
	private var lightningPool : List.<Transform>;
	private var lightningPoolLength : int;
	
	private var theShip : GameObject;
	private var lostVan : VanBehaviour;
	
	
	
	private var puzzleRunning : boolean = false;
	
	function Start () {
		theShip = gameObject.Find("TheShip");
		theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState(true);
		lostVan = GameObject.Find("van").GetComponent.<VanBehaviour>();
		//set the ships camera up for a multi cam scene
		//set to DONOTCLEAR
		lightningPool = new List.<Transform>();
		
		audioSource = GetComponent.<AudioSource>();
		//spawn us some more storms!
		for(var c : int = 0; c < 11; c++){
			
			
		
			var t : Transform = Instantiate(lightningPrefab, Vector3(10000,10000,10000), Quaternion.identity);
			t.GetComponent.<LightningBehaviour>().isDead = true;
			t.gameObject.active = false;
			
			lightningPool.Add(t);
		}
	}
	
	function startPuzzle(){
		if(puzzleRunning){
			return;
		}
		puzzleRunning = true;
		GetComponent.<LostVanBehaviour>().transmitState(true);
		OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "ALERT", "DISTRESS SIGNAL DETECTED", 2000);
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ALERT", "DISTRESS SIGNAL DETECTED. STARTING SIGNAL TRACKER", 3000);
		yield WaitForSeconds(1.5);
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "signalTracker");
		
		
	}
	

	function Update () {
		if(infected){
			if(theShip.GetComponent.<Reactor>().systemEnabled){
				if(audioSource.isPlaying == false){
					audioSource.clip = logSounds[2];
					audioSource.Play();
				}
				if(infectedTime + 5 < Time.fixedTime && !triggeredOverload){
					theShip.GetComponent.<Reactor>().reactorOverload(120);
					triggeredOverload = true;
				}
				if(Random.Range(0,100) < 6){
					//trigger a ship damage effect
					var msg : OSCMessage = OSCMessage("/ship/damage");	
					msg.Append.<float>(0);		
					OSCHandler.Instance.SendMessageToAll(msg);
				}
			} else {
				if(audioSource.isPlaying == true){
				
					audioSource.Stop();
				}
			}
		}
	
	}
	
	function MapSectorChanged(oldSector: Vector3, newSector : Vector3){
		//if the lightning storm is enabled then spawn a bunch of small storms around the sector
	
		Debug.Log ("Sector changed : " + newSector);
		var ct : int = 0;
		if(stormsEnabled){
			
			for(var i = 0; i < stormRate; i++){
				
				if(lightningPool[i].gameObject.active == false){
					lightningPool[i].gameObject.active = true;
					var pos : Vector3 = Random.onUnitSphere * 3000;
				
					lightningPool[i].GetComponent.<LightningBehaviour>().resetTo(pos);
					
				} 
			}
			
		}
		
	
	}

	private function findIdleStorm() : int {
		
	}
	
	function strikeAtPlayers(){
	}
	
	
	function ProcessOSCMessage(message : OSCPacket){
	
		var msgAddress = message.Address.Split(separator);
		// [1] = system, 2 = thing, 3 = operation
		var target = msgAddress[2];
		var operation = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(operation){
			
			case "startPuzzle":					//start transmitting distress signal
				startPuzzle();
				break;
			case "stormSpawnState":
			    stormsEnabled = message.Data[0] == 1 ? true : false;
			    break;
			case "stormRate":
				stormRate = message.Data[0];
				break;
			case "fileEntry":
				var fileId : int = message.Data[0];
				if(fileId == 1){
					audioSource.Stop();
					audioSource.clip = logSounds[0];
					audioSource.Play();
				} else if (fileId == 2){
					audioSource.Stop();
					audioSource.clip = logSounds[1];
					audioSource.Play();
					infected = true;
					infectedTime = Time.fixedTime;
					OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "ALERT", "VIRUS DETECTED", 2000);
					OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ALERT", "VIRUS DETECTED", 2000);
					OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "ALERT", "VIRUS DETECTED", 2000);
					OSCHandler.Instance.ChangeClientScreen("PilotStation", "pwned");			
					OSCHandler.Instance.ChangeClientScreen("TacticalStation", "pwned");		
					OSCHandler.Instance.ChangeClientScreen("EngineerStation", "pwned");		
					theShip.GetComponent.<Reactor>().brokenBoot = true;
					
				}
				
				break;
			case "diskInsert":
				var state : int = message.Data[0];
				var msg : OSCMessage = OSCMessage("/system/boot/diskInsert");	
				msg.Append.<int>(state);		
				OSCHandler.Instance.SendMessageToAll(msg);
				if(state == 1){
					disksRemaining --;
					if(disksRemaining == 0){
						infected = false;
						theShip.GetComponent.<Reactor>().interruptOverload();
						OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			
						OSCHandler.Instance.ChangeClientScreen("TacticalStation", "towing");		
						OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");	
						theShip.GetComponentInChildren.<GrapplingHook>().lockState = false;
						lostVan.hasBeenHacked = true;
						audioSource.Stop();
						
						
					}
				} 
				
				break;
			case "spawnLightning":
				var cloud = GameObject.Find("GasCloudEvil").GetComponent.<EvilCloudBehaviour>();
				var pos : Vector3 = theShip.transform.position + theShip.transform.TransformDirection(Vector3.forward) * 2000;
				cloud.resetTo(pos);
				cloud.targetStrike = theShip.transform;
				cloud.strikeAtTarget();
				theShip.GetComponent.<ship>().damageShip(Random.Range(1,3), "Reactor overloaded by Lightning");
				AudioSource.PlayClipAtPoint(strikeClip, theShip.transform.position);	//SOUND
				theShip.rigidbody.AddExplosionForce(100,theShip.transform.position + Random.onUnitSphere * 5.0f, 100,0, ForceMode.Impulse);
				var msg2 : OSCMessage = OSCMessage("/system/powerManagement/lightningStrike");	
				msg2.Append.<int>(Random.Range(1,3));		
				OSCHandler.Instance.SendMessageToAll(msg2);
				break;
				
		}
	
	
	}
	
	function SendOSCMessage(){}
	
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
	
}