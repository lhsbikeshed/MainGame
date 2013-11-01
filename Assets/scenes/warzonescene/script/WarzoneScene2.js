#pragma strict

class WarzoneScene2 extends GenericScene {
	
	/*
	 * TODO LIST
	 * move beaming to a trnsporter component
	 * adjust osc message to route properly to new component
	 * move targetting and tac radar bits to own components
	 
	 */
	
	
	@HideInInspector
	
	var sceneStartTime : float;	//when did scene start
	var introShip : LargeShipBehaviour;
	
	

	

/* missile stuff */
	var missilePrefab : Transform;
	
	
	private var lastMissileLaunchTime : float;	//last time a missile launch was started
	private var nextMissileLaunchTime : float; //when does the next missile launch? randomize this

	private var missilesEnabled  : boolean = false;
	

/* beaming sutff */
	
	var beamInSfx : AudioClip;
	var beamFailSfx : AudioClip;
	
	var ejectedDudePrefab : Transform;
	var airlockDumpSfx : AudioClip;
	
	var startBeamTime : float;	
	var maxBeamTime : float; 
	
	private var beamInProgress : boolean = false;
	private var beamEnabled : boolean = false;
	
	private var beamFailed : boolean = false;
	
	/* refs */
	private var theShip : Transform;
	private var shipSystem : ship;	
	var dynShitField : DynamicShitField;
	var mapController : MapController;
	
	
	
	var missileDiff : int = 11;
	
	function Start () {
		introShip = GameObject.Find("introShip").GetComponent.<LargeShipBehaviour>();
		//startScene();
		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
				theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (true);

		theShip.rigidbody.drag = 0.7f;
		shipSystem = theShip.GetComponent.<ship>();
	}
	
	/* kick off this mess */
	function startScene(){
		introShip.go();
		//introShip.velocity = Vector3(1.8,0,0);	//start the killing ship move into pos
		
		
		//tell clients large target detected
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "ENEMY SHIP DETECTED", 4000);
		
		yield(WaitForSeconds(5));	//wait for a bit then fire at the helper
		introShip.GetComponentInChildren(LaserTurretBehaviour).penetrating = true;
		introShip.fireAtTarget(GameObject.Find("Deadshiptarget").transform);
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "LARGE WEAPON CHARGE DETECTED", 4000);
		yield(WaitForSeconds(7));	//begin big splosion and pass the beam through the ship
		
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "INCOMING DEBRIS, TELL PILOT TO AVOID", 4000);
		
		GameObject.Find("DeadShip").GetComponent.<ExplodingShip>().startExplosion();
		
		theShip.GetComponent.<ExplosionOverlayBehaviour>().explode();
		
		//spawn some explodey things
		GameObject.Find("SceneScripts").GetComponent.<DynamicShitField>().enabled = true;
		theShip.GetComponent.<PropulsionSystem>().enableSystem();
		
		
		yield(WaitForSeconds(12));
		
		
		//introShip.velocity = Vector3(0,0,0);	//stop the killer and start firing missiles at the player
		introShip.exit();
		beamFailed = false;
	}
	
	function SetMissileState(state : boolean){
		missilesEnabled = state;
		if(missilesEnabled){
			lastMissileLaunchTime = Time.fixedTime;
			nextMissileLaunchTime = Random.Range(5,8);
			Debug.Log("MIssiles enabled");
		}
		
	}
	
	
	
	
	function Update () {
		
		
		if(missilesEnabled){
			if(lastMissileLaunchTime + nextMissileLaunchTime < Time.fixedTime && theShip.GetComponent.<Reactor>().systemEnabled == true){
				//fire another missile to keep the tactical guy busy
				var missPos = (Random.onUnitSphere * 2000);
				missPos.y = 0;
				missPos = theShip.transform.position + missPos;
				var g : Transform = Instantiate(missilePrefab, missPos, Quaternion.identity);
				g.GetComponent.<IncomingMissile>().targetTransform = theShip.transform;
				
				theShip.GetComponentInChildren.<TargettingSystem>().addObject(g.gameObject);
				
				//send a message to the console letting it know a missile was spawned
				var missMsg : OSCMessage = OSCMessage("/scene/warzone/missilelaunch");
				
				
				OSCHandler.Instance.SendMessageToAll(missMsg);
				nextMissileLaunchTime = Random.Range(missileDiff + 3, missileDiff + 5);
				lastMissileLaunchTime = Time.fixedTime;
				
				Debug.Log("Missile launched at : " + Time.fixedTime);
			}
		}
	}
	
	/* dont forget to make a noise here
	*/
	function weaponsPower(state : boolean){
			var wepMsg : OSCMessage = OSCMessage("/scene/warzone/tacticalState");
			if(state == true){
				wepMsg.Append.<int>(1);
			} else {
				wepMsg.Append.<int>(0);
			}
			OSCHandler.Instance.SendMessageToAll(wepMsg);
	}
	
	
	
	
	//OSC HANDLERS
	
	function ProcessOSCMessage(message : OSCPacket){
		
		var msgAddress = message.Address.Split(separator);
		var target = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(target){
			
				
			case "createBastard":
				dynShitField.createABastard();
				break;
			
			
			case "warzonestart":
				startScene();
				break;
			case "rodState":
				
				if (message.Data[0]  == 1){	
					weaponsPower(true);
				} else {
					weaponsPower(false);
				}
				
				break;
			case "missileLauncherStatus":
				
				if (message.Data[0]  == 1){	
					SetMissileState(true);
				} else {
					SetMissileState(false);
				}
				
				break;
			case "spawnGate":
				mapController.spawnGate();				
				
				break;
			case "missileRate":
				var d: int = message.Data[0];
				missileDiff = 12 - d;
				nextMissileLaunchTime = Random.Range(missileDiff + 3, missileDiff + 5);
				break;
			
		}
	
	
	}
	
	
	/* send out tacitcal updates */
	function SendOSCMessage(){
	
		
	}
	
	
	function configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a radar
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}

	
	
	
}