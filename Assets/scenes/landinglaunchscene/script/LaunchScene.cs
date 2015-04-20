using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
public class LaunchScene: GenericScene {

	public LaunchScene.SceneMode sceneMode;

	public float test2;
	public bool missileSpawning = false;
	public GameObject missileObj;
	float lastMissileTime;
	public float missileSpawnTime = 1.0f;
	
	public CameraPoint camPoint;
	public Transform landingChamber;
	DockChamberScript dockChamber;
	public ClampAnimator clamp;
	public ClampAnimator playerClamp;
	Transform theShip;
	
	public GameObject[] autopilotRoutes;
	
	public Transform autoPilotPrefab;
	
	public bool test = false;
	
	public override void Start() {

		theShip = GameObject.Find("TheShip").transform;
		//configure the scene for launch or landing based on us hyperspacing in
		if(JumpSystem.Instance.didWeWarpIn == true){
			sceneMode = SceneMode.MODE_LAND;
		}


		//theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (false);
		if(sceneMode == SceneMode.MODE_LAUNCH){
			//put the ship in the dock
			GameObject launchPos = GameObject.Find("LaunchPos");
			theShip.transform.position = launchPos.transform.position;
			theShip.transform.rotation = launchPos.transform.rotation;
			dockChamber = GameObject.Find("DockChamber").GetComponent<DockChamberScript>();

		} else {
			configureForLanding();
		}

		theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (false);
	}

	void configureForLanding(){
		Debug.Log ("landing mode..");
		GameObject exitPoint = GameObject.Find("JumpExit");
		if(exitPoint != null){
			theShip.transform.position = exitPoint.transform.position;
			theShip.transform.rotation = exitPoint.transform.rotation;
			float speed = 0.0f;
			speed = theShip.GetComponent<Rigidbody>().velocity.magnitude;
			theShip.GetComponent<Rigidbody>().velocity = (exitPoint.transform.rotation * Vector3.forward) * speed;
			
			UnityEngine.Debug.Log("Found exit node.." + exitPoint.transform.position);
			
		} 
		GameObject oldDock = GameObject.Find ("DockChamber");
		Vector3 pos = oldDock.transform.position;
		Quaternion rot = oldDock.transform.localRotation;
		Vector3 scale = oldDock.transform.localScale;
		Transform oldParent = oldDock.transform.parent;


		Destroy (oldDock);
		Transform g = (Transform)Instantiate(landingChamber, pos, rot);
		g.parent = oldParent;
		g.position = pos;
		g.localScale = scale;
		g.localRotation = rot;
		dockChamber = g.GetComponent<DockChamberScript>();
		dockChamber.openDoor();

		//start the station rotating
		GameObject.Find("STATIOn").GetComponent<Station>().rotating = true;

		//clear crap we dont need
		Destroy(GameObject.Find("npcvan"));
	}
	
	public override void Update() {
		if(test){
			test = false;
			
			flyToGate();
		}
	}
	
	//set to route 2
	//first route2 needs populating
	public void flyToGate(){
		TargetTrackController tgtTrack = GameObject.Find("TargetTrack").GetComponent<TargetTrackController>();
		Transform[] posList = tgtTrack.objectList;
		GameObject route = GameObject.Find("Route2");
		int i = 0;
		Transform g = null;
        foreach(Transform t in posList){
			if(t != null){
				g = (UnityEngine.Transform)Instantiate(autoPilotPrefab, t.position, Quaternion.identity);
				g.GetComponent<SequenceWaypoint>().newVelocity = 50.0f;
				g.GetComponent<SequenceWaypoint>().sensorDistance = 20.0f;
				g.gameObject.name = "wp." + i;
				g.parent = route.transform;
				i++;
			}
		}
		Transform jgPos = GameObject.Find("JumpGate").transform;
		g = (UnityEngine.Transform)Instantiate(autoPilotPrefab, jgPos.position, Quaternion.identity);
		g.GetComponent<SequenceWaypoint>().newVelocity = 50.0f;
		g.gameObject.name = "wp." + i;
		
		
		g.parent = route.transform;
		
		NPCShip otherShip = GameObject.Find("npcvan").GetComponent<NPCShip>();
		otherShip.SetAutopilotRoute(autopilotRoutes[1]);
		otherShip.StartFlight();
	}
	
	public IEnumerator launchOtherShip(){
		NPCShip otherShip = GameObject.Find("npcvan").GetComponent<NPCShip>();
		otherShip.SetReactorState(true);
		yield return new WaitForSeconds(1.5f);
		GameObject.Find("npcvan").GetComponent<UndercarriageBehaviour>().setGearState(false);

		//drop the ship
		clamp.trigger();

		yield return new WaitForSeconds(3.5f);
		otherShip.transform.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.None;
		otherShip.GetComponent<Rigidbody>().AddRelativeForce(Vector3.down * 30.0f, ForceMode.Impulse);
		otherShip.GetComponent<Rigidbody>().AddRelativeTorque(Vector3.forward * UnityEngine.Random.Range(-10.0f, 10.0f), ForceMode.Impulse);
		otherShip.SetAutopilotRoute(autopilotRoutes[0]);
		otherShip.StartFlight();
		
	}
	
	public void beginLaunch(){
		if(sceneMode == SceneMode.MODE_LAUNCH){
			GameObject.Find("NPCInternalDoor").GetComponent<DoorScript>().openDoor();
			StartCoroutine(GameObject.Find("NPCShipMover").GetComponent<LaunchSequencer>().begin());
			
			GameObject.Find("InternalDoor").GetComponent<DoorScript>().openDoor();
			StartCoroutine(GameObject.Find("ShipMover").GetComponent<LaunchSequencer>().begin());
			
			if(camPoint != null){
				camPoint.OnTriggerEnter(theShip.GetComponent<Collider>());
			}
		}
	}
	
	public void FixedUpdate(){
		if(missileSpawning){
			if(lastMissileTime + missileSpawnTime < Time.fixedTime){
				lastMissileTime = Time.fixedTime;
				Vector3 pos = transform.position + UnityEngine.Random.onUnitSphere * 1500.0f;
				GameObject miss  = (GameObject)Instantiate(missileObj, pos, Quaternion.identity);
				miss.GetComponent<IncomingMissile>().isDummy = true;
				miss.GetComponent<IncomingMissile>().targetTransform = theShip;
				miss.GetComponent<IncomingMissile>().trackingPlayer = true;
				theShip.GetComponentInChildren<TargettingSystem>().addObject(miss);
			}
		}
	}	
	
	public void hyperspaceOtherShip(){
		NPCShip otherShip = GameObject.Find("npcvan").GetComponent<NPCShip>();
		otherShip.startJump();
	}
	
	public IEnumerator releaseDockingClamp(){
		playerClamp.trigger();
		yield return new WaitForSeconds(1.0f);
		theShip.GetComponent<ShipCore>().releaseClamp();
		
	}
	
	public override void ProcessOSCMessage(OSCPacket message){
	
		String[] msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		String target = msgAddress[2];
		String operation = msgAddress.Length > 2 ? msgAddress[3] : "";
		
		
		switch(operation){
			case "startLaunch":
				beginLaunch();
				break;
				
			case "dockingBay":			//-----open docking bay hal -----
				//var dockingChamber = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				//if (dockChamber == null){ return; }
				Debug.Log ("door");
				if ((int)message.Data[0]  == 1){		
					dockChamber.openDoor();
					if(sceneMode == SceneMode.MODE_LAUNCH){
						GameObject.Find("STATIOn").GetComponent<Station>().rotating = true;
					}
				} else { 
					dockChamber.closeDoor();
				}
				break;
			case "bayGravity":
				//var dockingBayScript = GameObject.Find("DockChamber").GetComponent.<DockChamberScript>();
				if (dockChamber == null){ return; }
				dockChamber.setGravity( (int)message.Data[0] == 1 ? true : false );
				break;
			case "trainingMissiles":
				//turn on the missile spawner
				missileSpawning = (int)message.Data[0] == 1 ? true : false ;
				break;
			case "targetGate":
				bool tgt = (int)message.Data[0] == 1 ? true : false;
				GameObject.Find("JumpGate").GetComponent<GeneralTrackableTarget>().highlighted = tgt;
				break;
			case "launchOtherShip":
				StartCoroutine(launchOtherShip());
				break;
			case "otherShipToGate":
				flyToGate();
				break;
			case "otherShipHyperspace":
				hyperspaceOtherShip();
				break;
			case "releaseClamp":
				StartCoroutine(releaseDockingClamp());
				break;

			case "startDock":
				GameObject.Find("InternalDoor").GetComponent<DoorScript>().openDoor();
				StartCoroutine(GameObject.Find("ShipMover").GetComponent<LaunchSequencer>().begin());
				break;

			case "dockingCompState":
				GameObject g = GameObject.Find("DockingComp");
				if(g != null){
					int s = (int)message.Data[0];
					if(s == 0){
						g.GetComponent<DockingComputer>().TurnOff();
					} else {
						g.GetComponent<DockingComputer>().TurnOn();
					}
				}
				break;
			}
	
	
	}
	
	public override void SendOSCMessage(){
//		if(dockChamber.inBay == true){
//			Vector3 pos = theShip.transform.localPosition;
//			Quaternion rot = theShip.transform.localRotation;
//			OSCMessage msg = new OSCMessage("/scene/launchland/dockingPosition");
//			//this needs inverting when ship is facing forward in bay
//			Vector3 bayForward = dockChamber.transform.TransformDirection(Vector3.left);
//			Vector3 shipForward = theShip.transform.TransformDirection(Vector3.forward);
//			test2 = Vector3.Dot(bayForward, shipForward);
//			if(Vector3.Dot(bayForward, shipForward) < 0.0f){
//				msg.Append<float>(pos.x);
//			} else {
//				msg.Append<float>(-pos.x);
//			}
//			msg.Append<float>(pos.y);
//			msg.Append<float>(pos.z);
//			
//			
//			
//			msg.Append<float>(rot.eulerAngles.x);
//			msg.Append<float>(rot.eulerAngles.y);
//			msg.Append<float>(rot.eulerAngles.z);
//			OSCHandler.Instance.SendMessageToAll(msg);
//		}
	
	}
	
	
	
	public override void configureClientScreens(){
		if(sceneMode == SceneMode.MODE_LAUNCH){
			if(dockChamber != null && dockChamber.inBay){
				OSCHandler.Instance.ChangeClientScreen("PilotStation", "landingDisplay");			//give the pilot a dockign comp
			} else {
				OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");	

			}
		} else {
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");	
		}
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}

	public enum SceneMode {
		MODE_LAUNCH, MODE_LAND
	}

}
