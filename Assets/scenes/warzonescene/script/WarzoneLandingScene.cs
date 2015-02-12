using UnityEngine;
using System;
using UnityOSC;
using System.Collections;
/*
 * Scene script
 * Ship arrives on scene, slightly off course and far out from the base
 * captain tells them to approach the base
 * scenestart causes a fleet of ships to appear
 * they all shoot the base
 * base begins to explode
 * start the timer
 * 10 mins to escape
 * at t-1 minute drop the a jumpgate
 */
 
[System.Serializable]
public class WarzoneLandingScene: GenericScene {

	//evac timer stuff
	public float evacTimer = 900f;
	public bool evacRunning = false;
	public bool redAlertTriggered = false;
	

	/* missile stuff */
	public Transform missilePrefab;	
	float lastMissileLaunchTime;	//last time a missile launch was started
	float nextMissileLaunchTime; //when does the next missile launch? randomize this
	bool missilesEnabled = false;
	public int missileDiff = 11;
	
	/* refs */
	Transform theShip;
	ShipCore shipSystem;	
	public DynamicShitField dynShitField;
	public MapController mapController;
	public GameObject[] fleetShips;
	public Transform starBase;
	
	/* scene timer */
	public float sceneStartTime = 0.0f;
	public bool screensReverted = false;
	
	/* audio assets */
	public AudioClip evacSound;
	public AudioClip warningSound;
	public float warningTimer = 0.1f;
	
	public bool test = false;
	
	
	public override void Start() {
	
		//startScene();
		theShip = GameObject.Find("TheShip").transform;
		theShip.rigidbody.useGravity = false;
				theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (true);
 
		theShip.rigidbody.drag = 0.7f;
		shipSystem = theShip.GetComponent<ShipCore>();
		sceneStartTime = Time.fixedTime;
		//tell the clients we are now on the return leg of the journey, it prevents the jump plotter from triggering events
		OSCMessage msg = new OSCMessage("/ship/state/setReturnJourney");
		msg.Append(1);
		OSCHandler.Instance.SendMessageToAll(msg);
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "restrictedArea", true);			
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "restrictedArea", true);		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "restrictedArea", true);	
		
	}
	
	
	public void startEvacSequence(){
		//start the evac timer on comms
		OSCMessage msg = new OSCMessage("/scene/warzone/evacStart");		
		int t = (int)(evacTimer * 1000);
		
		msg.Append(t);
		OSCHandler.Instance.SendMessageToAll(msg);
		
		AudioSource.PlayClipAtPoint(evacSound, transform.position);
		
		//start our evac timer
		evacRunning = true;
		
		
		
	}
	
	/* kick off this mess */
	public IEnumerator startScene(){
		//jump the warships into the scene
		foreach(GameObject t in fleetShips){
			t.GetComponent<FleetShipBehaviour>().startJump();
			
		}
		
		yield return new WaitForSeconds(4.0f);
		FleetShipBehaviour s = null;
		//make them target the base
		foreach(GameObject t in fleetShips){
			s =  t.GetComponent<FleetShipBehaviour>();
			s.aimAtTarget(starBase);
			s.fireLaser();
		}
		
		yield return new WaitForSeconds(9.0f);
		foreach(GameObject t in fleetShips){
			s =  t.GetComponent<FleetShipBehaviour>();
			s.setLaserPenetration(true);
		}
		theShip.GetComponent<ExplosionOverlayBehaviour>().explode();
		starBase.GetComponent<ExplodingBaseBehaviour>().startFallingApart();
		GameObject.Find("SceneScripts").GetComponent<DynamicShitField>().setAllVelocities(new Vector3( 0.0f, 0.0f, -90.0f));
		yield return new WaitForSeconds(1.0f);
		
		
		foreach(GameObject t in fleetShips){
			if(t != fleetShips[3]){
				s =  t.GetComponent<FleetShipBehaviour>();
				s.jumpDestination = new Vector3(-1500.0f,0.0f,-2000.0f);
				s.startJump();
			}
		}
		
		startEvacSequence();
		
		
	}
	
	public void SetMissileState(bool state){
		missilesEnabled = state;
		if(missilesEnabled){
			lastMissileLaunchTime = Time.fixedTime;
			nextMissileLaunchTime = (float)UnityEngine.Random.Range(5,8);
			UnityEngine.Debug.Log("MIssiles enabled");
		}
		
	}
	
	public IEnumerator endScene(){
		starBase.GetComponent<ExplodingBaseBehaviour>().finalExplosion();
		theShip.GetComponent<ExplosionOverlayBehaviour>().explode();
		//send out a brace warning to consoles
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		OSCHandler.Instance.DisplayBannerAtClient("PilotStation", "!!WARNING!!", "INCOMING SHOCKWAVE. BRACE FOR IMPACT", 5000);
		
		//play blastwave alert on all clients
		OSCMessage msg = new OSCMessage("/ship/effect/playSound");		
		msg.Append("blastwave");
		OSCHandler.Instance.SendMessageToAll(msg);
		
		yield return new WaitForSeconds(3.8f);
		theShip.rigidbody.AddExplosionForce(100.0f, theShip.transform.position + UnityEngine.Random.onUnitSphere * 10.0f, 30.0f, 0.0f);
		StartCoroutine(theShip.GetComponent<ShipCore>().damageShip(1000.0f, "Destroyed by shockwave"));
	}
	
	public void FixedUpdate(){
		if(test){
			test = false;
			StartCoroutine(endScene());
		}
	
		if(Time.fixedTime - sceneStartTime > 4.0f && screensReverted == false){
			//configureClientScreens();
			OSCHandler.Instance.RevertClientScreen("TacticalStation", "restrictedArea");
			OSCHandler.Instance.RevertClientScreen("PilotStation", "restrictedArea");
			OSCHandler.Instance.RevertClientScreen("EngineerStation", "restrictedArea");
			screensReverted = true;
		}
		if(evacRunning){
			evacTimer -= Time.fixedDeltaTime;
			
			if(evacTimer < 0.0f){
				//kill the ship
				evacRunning = false;
				StartCoroutine(endScene());
			}
			
			if( evacTimer <= 60f){
				if(redAlertTriggered == false ){
					redAlertTriggered = true;
					CabinEffects.Instance().setRedAlert(true);
				}
				warningTimer -= Time.fixedDeltaTime;
				if(warningTimer <= 0.0f){
					warningTimer = 4.0f;
					AudioSource.PlayClipAtPoint(warningSound, transform.position);
				}
				
			}
			
		}
		if(missilesEnabled){
			if(lastMissileLaunchTime + nextMissileLaunchTime < Time.fixedTime && theShip.GetComponent<Reactor>().systemEnabled == true){
				spawnMissile();
			}
		}
	}

	public void spawnMissile(){

		Vector3 missPos = (UnityEngine.Random.onUnitSphere * 2000);
		missPos.y = 0.0f;
		missPos = theShip.transform.position + missPos;
		Transform g = (UnityEngine.Transform)Instantiate(missilePrefab, missPos, Quaternion.identity);
		g.GetComponent<IncomingMissile>().targetTransform = theShip.transform;
		
		theShip.GetComponentInChildren<TargettingSystem>().addObject(g.gameObject);
		
		//send a message to the console letting it know a missile was spawned
		OSCMessage missMsg = new OSCMessage("/scene/warzone/missilelaunch");
		
		
		OSCHandler.Instance.SendMessageToAll(missMsg);
		nextMissileLaunchTime = (float)UnityEngine.Random.Range(missileDiff + 3, missileDiff + 5);
		lastMissileLaunchTime = Time.fixedTime;

		
		UnityEngine.Debug.Log("Missile launched at : " + Time.fixedTime);
	}

	
	public void OnDestroy(){
		if(redAlertTriggered == true){
				
			CabinEffects.Instance().setRedAlert(false);
		}
	}
	
	//OSC HANDLERS
	
	public override void ProcessOSCMessage(OSCPacket message){
		
		string[] msgAddress = message.Address.Split(separator);
		string target = msgAddress.Length >= 3 ? msgAddress[3] : "" + 0;
		
		switch(target){
			
				
			case "createBastard":
			
				if(dynShitField.enabled == true){
					dynShitField.createABastard();
				}
				break;
			
			
			case "warzonestart":
				StartCoroutine(startScene());
				break;
			
			case "missileLauncherStatus":
				
				if ((int)message.Data[0]  == 1){	
					SetMissileState(true);
				} else {
					SetMissileState(false);
				}
				
				break;
			case "spawnGate":
				mapController.spawnGate();	
				
				
				break;
			case "missileRate":
				int d = (int)message.Data[0];
				UnityEngine.Debug.Log("d:" + d);
				missileDiff = 12 - d;
				nextMissileLaunchTime = (float)UnityEngine.Random.Range(missileDiff + 1, missileDiff + 3);
				break;
			case "spawnMissile":
				spawnMissile();
				break;
				
		}
	
	
	}
	
	
	/* send out tacitcal updates */
	public override void SendOSCMessage(){
	
		
	}
	
	
	public override void configureClientScreens(){
		//first 4 seconds of the scene should show a restricted area warning, after that go back to default screens
		if(Time.fixedTime - sceneStartTime > 4.0f){
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a radar
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
		} else {
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "restrictedArea", true);			
			OSCHandler.Instance.ChangeClientScreen("TacticalStation", "restrictedArea", true);		
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "restrictedArea", true);			
		}
	
	}

	
	
	
}
