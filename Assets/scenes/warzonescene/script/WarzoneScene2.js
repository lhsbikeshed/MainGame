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
	var introShip : LargeShipBehaviour2;
	
	

	/* camera points */
	var cameraPointPrefab : Transform;
	
	var evacTimer : float = 900f;
	var evacRunning : boolean = false;
	

/* missile stuff */
	var missilePrefab : Transform;

	
	private var lastMissileLaunchTime : float;	//last time a missile launch was started
	private var nextMissileLaunchTime : float; //when does the next missile launch? randomize this

	private var missilesEnabled  : boolean = false;
	

/* beaming sutff */
	
	
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
	
	
	var test : boolean = false;
	var missileDiff : int = 11;
	
	function Start () {
		introShip = GameObject.Find("introShip").GetComponent.<LargeShipBehaviour2>();
		//startScene();
		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
				theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (true);
 
		theShip.rigidbody.drag = 0.7f;
		shipSystem = theShip.GetComponent.<ship>();
		
		
	}
	
	
	function startEvacSequence(){
		
		
		//trigger the comms video warning of impending explosion
//		var msg : OSCMessage = OSCMessage("/comms/playVideo");
//		msg.Append("station.mov");		
//		OSCHandler.Instance.SendMessageToAll(msg);
		//start the evac timer on comms
		var msg : OSCMessage = OSCMessage("/scene/warzone/evacStart");		
		var t : int = evacTimer * 1000;
		
		msg.Append(t);
		OSCHandler.Instance.SendMessageToAll(msg);
		//start our evac timer
		evacRunning = true;
		//move the first ship to hyperspace
		introShip.exit();
		
		
	}
	
	/* kick off this mess */
	function startScene(){
		
		
		//introShip.velocity = Vector3(1.8,0,0);	//start the killing ship move into pos
		
		
		//tell clients large target detected
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "ENEMY SHIP DETECTED", 4000);
		
		yield(WaitForSeconds(4));	//wait for a bit then fire at the helper
		introShip.GetComponentInChildren(LaserTurretBehaviour).penetrating = true;
		introShip.fireAtTarget(GameObject.Find("Deadshiptarget").transform);
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "LARGE WEAPON CHARGE DETECTED", 4000);
		yield(WaitForSeconds(3));	//begin big splosion and pass the beam through the ship
		
		GameObject.Find("DeadShip").GetComponent.<ExplodingShip>().startFireEffects();
		yield(WaitForSeconds(2));
		//theShip.GetComponent.<ExplosionOverlayBehaviour>().explode();
		
		
		//spawn some explodey things
		GameObject.Find("SceneScripts").GetComponent.<DynamicShitField>().setAllVelocities(Vector3( 0, 0, -90));
		
		theShip.GetComponent.<PropulsionSystem>().enableSystem();
		for(var p : ParticleSystem in gameObject.Find("GunEffects").GetComponentsInChildren.<ParticleSystem>()){
			p.enableEmission = false;
		}
		GetComponent.<AudioSource>().Stop();

		beamFailed = false;
		
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
		GameObject.Find("DeadShip").GetComponent.<ExplodingShip>().startExplosion();
		theShip.GetComponent.<ExplosionOverlayBehaviour>().explode();
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
		if(evacRunning){
			evacTimer -= Time.fixedDeltaTime;
			
			if(evacTimer < 0.0f){
				//kill the ship
				evacRunning = false;
				endScene();
			}
		}
	}
	
	function Update () {
		
		if(test){
			test = false;
			startEvacSequence();
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

	
	function SpawnDistressSignal(){
		var g = GameObject.Find("van-dead");		
		if(g == null){
			Debug.Log("Dead van not found..");
			return;
		}
		
		var d : DeadShip = g.GetComponent.<DeadShip>();
		if(d.hidden == false){
			d.show();
		}
		
	
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
				var pos : Vector3 = GameObject.Find("JumpGate").transform.position;
				var cp : Transform = Instantiate(cameraPointPrefab, pos, Quaternion.identity);
				cp.GetComponent.<SphereCollider>().radius = 200.0f;		
				
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
			case "spawnDistressSignal":
				SpawnDistressSignal();
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