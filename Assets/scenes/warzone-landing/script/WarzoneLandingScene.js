#pragma strict

class WarzoneLandingScene extends GenericScene {
	
	/*
	 * TODO LIST
	 * move beaming to a trnsporter component
	 * adjust osc message to route properly to new component
	 * move targetting and tac radar bits to own components
	 
	 */

	var evacTimer : float = 900f;
	var evacRunning : boolean = false;
	

/* missile stuff */
	var missilePrefab : Transform;

	
	private var lastMissileLaunchTime : float;	//last time a missile launch was started
	private var nextMissileLaunchTime : float; //when does the next missile launch? randomize this

	private var missilesEnabled  : boolean = false;
	
	
	/* refs */
	private var theShip : Transform;
	private var shipSystem : ship;	
	var dynShitField : DynamicShitField;
	var mapController : MapController;
	
	
	var test : boolean = false;
	var missileDiff : int = 11;
	
	function Start () {
	
		//startScene();
		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
				theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (true);
 
		theShip.rigidbody.drag = 0.7f;
		shipSystem = theShip.GetComponent.<ship>();
		
		
	}
	
	
	function startEvacSequence(){
		//start the evac timer on comms
		var msg : OSCMessage = OSCMessage("/scene/warzone/evacStart");		
		var t : int = evacTimer * 1000;
		
		msg.Append(t);
		OSCHandler.Instance.SendMessageToAll(msg);
		//start our evac timer
		evacRunning = true;
		
		
		
	}
	
	/* kick off this mess */
	function startScene(){

		
		startEvacSequence();
		
		
	}
	
	function SetMissileState(state : boolean){
		missilesEnabled = state;
		if(missilesEnabled){
			lastMissileLaunchTime = Time.fixedTime;
			nextMissileLaunchTime = Random.Range(5,8);
			Debug.Log("MIssiles enabled");
		}
		
	}
	
	function endScene(){
		
		//send out a brace warning to consoles
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		
		//play blastwave alert on all clients
		var msg : OSCMessage = OSCMessage("/ship/effect/playSound");		
		msg.Append("blastwave");
		OSCHandler.Instance.SendMessageToAll(msg);
		
		yield WaitForSeconds(3.8f);
		theShip.rigidbody.AddExplosionForce(100.0f, theShip.transform.position + Random.onUnitSphere * 10.0f, 30.0f, 0.0f);
		theShip.GetComponent.<ship>().damageShip(1000, "Destroyed by shockwave");
	}
	
	function FixedUpdate(){
		if(test){
			test = false;
			startEvacSequence();
		}
	
		if(evacRunning){
			evacTimer -= Time.fixedDeltaTime;
			
			if(evacTimer < 0.0f){
				//kill the ship
				evacRunning = false;
				endScene();
			}
		}
		if(missilesEnabled){
			if(lastMissileLaunchTime + nextMissileLaunchTime < Time.fixedTime && theShip.GetComponent.<Reactor>().systemEnabled == true){
				spawnMissile();
			}
		}
	}

	function spawnMissile(){

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

	
	
	
	//OSC HANDLERS
	
	function ProcessOSCMessage(message : OSCPacket){
		
		var msgAddress = message.Address.Split(separator);
		var target = msgAddress.length >= 3 ? msgAddress[3] : 0;
		
		switch(target){
			
				
			case "createBastard":
			
				if(dynShitField.enabled == true){
					dynShitField.createABastard();
				}
				break;
			
			
			case "warzonestart":
				startScene();
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
				Debug.Log("d:" + d);
				missileDiff = 12 - d;
				nextMissileLaunchTime = Random.Range(missileDiff + 1, missileDiff + 3);
				break;
			case "spawnMissile":
				spawnMissile();
				break;
			case "spawnMissile":
				spawnMissile();
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