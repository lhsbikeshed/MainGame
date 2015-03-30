using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
/*
 * Current plan
 * players enter hyperspace
 * engineer screen shows the bubble graph, players keep the current field aligned with a ghost version
 * when they do well the bubble becomes more stable and the ship flies "faster" (this gives speed runners some skills to practice)
 * if tunnel stability ever reaches zero then start slowly damaging the ship. Players can die from this
 * 
 * TODO:
 * implement variable scene time
 * change player screens to use "distance remaining" instead of "time remaining". This will need some fudging for interuptions to the route (i.e. mars and the comet)
 * for now remove the distance/time displays from hyperspace display
 * Consider fuel usage
 * implement a "distance to destination" function in the map libraries. Should skip over 
 */
public class Hyperspace: GenericScene {
	/*
	OUTPUT
	/warpscene/failjump		x = seconds until exit
	/warpscene/exitjump
	
	*/


	//jump parameters
	string destinationScene = "";	//where are we going?
	bool showFailAtClient = false; // during the exit process should we show a failure message on the clients screen?
	public float timeRemaining; //how long before we naturally exit the stream
	float sceneEntryTime = -10.0f;
	bool exiting = false;		//is the exit sequence in progress. Prevents double exits (this has happened :/ )
	public float tunnelStability = 0.5f;
	float lerpStability = 0.5f;
	float damageTimer = 1.0f;	//how often we damage the ship when the warp field is collapsed

	//asset refs
	public AudioClip[] failSfx ; 	//list of sound effects for failures
	public Transform planetFallPrefab;
	public Transform cometPrefab;
	ParticleSystem warpParticles ;
	GameObject theShip; //the ship
	PersistentScene ps;	//global crap
	OSCSystem oscSender;
	JumpSystem jumpSystem;

	Transform eventObject;	//an object that is triggered in this scene

	Vector3 shipStartPos;


	

	public override void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");

		}
		shipStartPos = theShip.transform.position;
		sceneEntryTime = Time.fixedTime;

		
		/* lock the ship in place and prevent physics taking over */
		theShip.GetComponent<Rigidbody>().velocity = new Vector3(0.0f,0.0f,0.0f);
		theShip.GetComponent<Rigidbody>().freezeRotation = true;
		theShip.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.FreezeAll;

		//reset the camera in case we came from a dynamic skybox scene
		theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (false);
		theShip.GetComponentInChildren<Camera>().backgroundColor = new Color(0.0f,0.0f,0.0f);

		//get refs to the jump system and turn the open effect off
		jumpSystem = theShip.GetComponent<JumpSystem>();		
		theShip.GetComponentInChildren<JumpEffects>().setJumpEffectState(false);
		//add a requirement to be in flat space, prevents players double-hyperspacing
		jumpSystem.addRequirement(new SystemRequirement("FLATSPACE", "not in area of flat spacetime"));

		//scene refs
		ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent<OSCSystem>();
		warpParticles = GameObject.Find("warp bits").GetComponent<ParticleSystem>();

		//stop ship consuming oxygen, this is temporary until engineer gets a second screen to manage it with
		theShip.GetComponent<MiscSystem>().consuming = false;	//temporarily disable oxygen consumption
		//prevent throttle from working
		theShip.GetComponent<PropulsionSystem>().throttleDisabled = true;
		  
		  
		 //spawn any special prefabs given our destination, currently only mars and a comet
		destinationScene = ps.hyperspaceDestination;
		if(destinationScene == "drop"){				
			//instantiate the planet fall prefab
			Transform t = (UnityEngine.Transform)Instantiate(planetFallPrefab, Vector3.zero, Quaternion.identity);
			t.GetComponent<HyperSpaceEvent>().triggerTime = timeRemaining - 5.0f;
			showFailAtClient = true;
			eventObject = t;
		} else if (destinationScene == "comet-tunnel" ){
			//instantiate the planet fall prefab
			Transform t2 = (UnityEngine.Transform)Instantiate(cometPrefab, Vector3.zero, Quaternion.identity);
			t2.GetComponent<HyperSpaceEvent>().triggerTime = timeRemaining - 8.0f;
			showFailAtClient = true;
			eventObject = t2;

			//TODO this is broken
		}
		
	}
	
	public void FixedUpdate() {		
		//have we gone over the alloted time for this scene? If so start the exit process
		if(timeRemaining < 0.0f && !exiting){
			UnityEngine.Debug.Log("EXITING " + Time.fixedTime + " "  + (sceneEntryTime + timeRemaining));
			StartCoroutine(startExit(showFailAtClient));	//TODO i dont think we need the ps.forcedhyperspacefail field anymore. Force exits are part of map nodes now
			
		} 

		//change the size of the warp field based on how stable it is (0.0 - 1.0f);
		lerpStability = Mathf.Lerp (lerpStability, tunnelStability, 0.5f);
		float size = UsefulShit.map (lerpStability, 0.0f, 1.0f, 5f, 15f);

		warpParticles.transform.localScale = Vector3.one * size;
		//now damage the ship if the warp field has collapsed on the ship
		if (tunnelStability <= 0.1f) {
			damageTimer -= 0.01f;
			if (damageTimer <= 0.0f) {
					damageTimer = 1f;
					StartCoroutine (theShip.GetComponent<ShipCore> ().damageShip ((float)UnityEngine.Random.Range (3, 10), "Crushed by a collapsing hyperspace bubble"));
			}
		}
		float shakeAmount = UsefulShit.map (tunnelStability, 0 , 1.0f, 0.4f, 0.01f);
		theShip.transform.position = shipStartPos + UnityEngine.Random.onUnitSphere * shakeAmount;

		//theShip.transform.rotation *= Quaternion.Euler(0,0,0.4f);

		//slowly reduce maxtimeinscene
		timeRemaining -= UsefulShit.map (tunnelStability, 0.0f, 1.0f, 0.05f, 1f) * Time.fixedDeltaTime;
	}
	
	public float getTimeRemaining(){
		return timeRemaining;
	}

	//TODO: dont think we need this
	public void hadAFail(){
		

		AudioSource.PlayClipAtPoint(failSfx[ UnityEngine.Random.Range(0,failSfx.Length) ], theShip.transform.position);
		StartCoroutine(theShip.GetComponent<ShipCore>().damageShip((float)UnityEngine.Random.Range(3,10), "Broken apart by hyperspace disturbances"));
	}
	
	
	
	//start the exit process
	public IEnumerator startExit(bool failure){
		if(exiting == false){
			exiting = true;

			warpParticles.startColor = new Color(255.0f,0.0f,0.0f);
			//change animations
			//send an osc message /warp/failed {time to failure}
			//turn on the exit effect
			theShip.GetComponentInChildren<JumpEffects>().setJumpEffectState(true);

			if(failure){
				
				//broadcast that we failed the jump
				OSCMessage msg = new OSCMessage("/scene/warp/failjump");		
				msg.Append<int>( 7 ); // 10 seconds until exit fail			
				OSCHandler.Instance.SendMessageToAll(msg);
				//see if there is a planet in the scene and fire it off
				
				
			} else{
				OSCMessage msg2 = new OSCMessage("/scene/warp/exitjump");		
				msg2.Append<int>( 7 ); // 10 seconds until exit fail
				OSCHandler.Instance.SendMessageToAll(msg2);
			}
			yield return new WaitForSeconds(7.0f);
			
			theShip.GetComponent<Rigidbody>().freezeRotation = false;
			theShip.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.None;
			theShip.GetComponent<JumpSystem>().didWeWarpIn = true;
			theShip.GetComponent<MiscSystem>().consuming = true; //reenable air consumption
			theShip.GetComponent<Rigidbody>().angularDrag = 0.5f;
		 	theShip.GetComponent<PropulsionSystem>().throttleDisabled = false;

			theShip.transform.parent = null;
			
			OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
			OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
			OSCHandler.Instance.RevertClientScreen("EngineerStation", "hyperspace");
			//TODO change to string scene name
			Application.LoadLevel(ps.hyperspaceDestination);
		}
		
		
	}
	
	
	//OSC handling
	public override void ProcessOSCMessage(OSCPacket msg){
		string[] msgAddress = msg.Address.Split(separator);
		string target = msgAddress.Length > 2 ? msgAddress[3] : "" + 0;
		
		switch(target){				
		case "warpfail":				
			hadAFail();			
			break;	
		case "tunnelStability":
			tunnelStability = (float)msg.Data[0];
			break;
		}	
	}
	
	public override void SendOSCMessage(){	
		OSCMessage msg = new OSCMessage("/scene/warp/updatestats");
		msg.Append<float>(0.0f);		
		msg.Append<float>(getTimeRemaining());		
		msg.Append<int>(showFailAtClient == true ? 1 : 0);	//TODO: remove this? would need to be removed from hyperspacedisplay too
		msg.Append<string>(jumpSystem.jumpDest);
		OSCHandler.Instance.SendMessageToAll( msg);	
	}
	
	public override void LeaveScene(){
		OSCHandler.Instance.RevertClientScreen("PilotStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("TacticalStation", "hyperspace");
		OSCHandler.Instance.RevertClientScreen("EngineerStation", "hyperspace");
	}
	
	public override void configureClientScreens(){
		//pilot and tactical should already be in hyperspace screen at this point
		
		//OSCHandler.Instance.ChangeClientScreen("PilotStation", "hyperspace");			
		//OSCHandler.Instance.ChangeClientScreen("TacticalStation", "hyperspace");		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "hyperspace", true);			
	
	}
	
}
