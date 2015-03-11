using UnityEngine;
using System;
using System.Collections;
using UnityOSC;

[System.Serializable]
public class Hyperspace: GenericScene {
	/*
	OUTPUT
	/warpscene/failjump		x = seconds until exit
	/warpscene/exitjump
	
	*/
	
	public int destination; //destination scene when we exit
	public float maxTimeInScene; //how long before we naturally exit the stream
	
	public bool forceFail;		//are we forced to fail(eg in first jump scene)
	public AudioClip[] failSfx ; 	//list of sound effects for failures
	
	
	
	public Transform planetFallPrefab;
	public Transform cometPrefab;
	
	[HideInInspector]
	
	
	
	float failTime; //time of failures, used to time colour changes in the warp particles
	ParticleSystem warpParticles ;
	
	
	float sceneEntryTime = -10.0f;
	bool exiting = false;
	bool failing = false;
	
	bool fallingTowardPlanet = false;
	
	//refs 
	GameObject theShip; //the ship
	PersistentScene ps;	//global crap
	OSCSystem oscSender;
	JumpSystem jumpSystem;
	
	string destinationScene = "";
	
	public override void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		
		
		theShip.GetComponent<Rigidbody>().velocity = new Vector3(0.0f,0.0f,0.0f);
		sceneEntryTime = Time.fixedTime;
		theShip.GetComponent<Rigidbody>().freezeRotation = true;
		theShip.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.FreezeAll;
		//reset the camera in case we came from a dynamic skybox scene
		theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (false);
		jumpSystem = theShip.GetComponent<JumpSystem>();
		
		theShip.GetComponentInChildren<JumpEffects>().setJumpEffectState(false);
		jumpSystem.addRequirement(new SystemRequirement("FLATSPACE", "not in area of flat spacetime"));
		theShip.GetComponentInChildren<Camera>().backgroundColor = new Color(0.0f,0.0f,0.0f);
		
		ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
		oscSender = GameObject.Find("PersistentScripts").GetComponent<OSCSystem>();
		warpParticles = GameObject.Find("warp bits").GetComponent<ParticleSystem>();
		theShip.GetComponent<MiscSystem>().consuming = false;	//temporarily disable oxygen consumption
		
		 theShip.GetComponent<PropulsionSystem>().throttleDisabled = true;
		  
		  
		  
		destinationScene = ps.hyperspaceDestination;
		if(destinationScene == "drop"){
		
				
			//instantiate the planet fall prefab
			Transform t = (UnityEngine.Transform)Instantiate(planetFallPrefab, Vector3.zero, Quaternion.identity);
			t.GetComponent<PlanetFallEvent>().triggerTime = maxTimeInScene - 5.0f;
		} else if (destinationScene == "comet-tunnel" ){
			//instantiate the planet fall prefab
			Transform t2 = (UnityEngine.Transform)Instantiate(cometPrefab, Vector3.zero, Quaternion.identity);
			t2.GetComponent<CometEvent>().triggerTime = maxTimeInScene - 8.0f;
		}
		
	}
	
	public void FixedUpdate() {
		
		
		if(Time.fixedTime > sceneEntryTime + maxTimeInScene && !exiting){
			
			UnityEngine.Debug.Log("EXITING " + Time.fixedTime + " "  + (sceneEntryTime + maxTimeInScene));
			StartCoroutine(startExit(ps.forcedHyperspaceFail));
			
		}
		
		
		// fail colours
		if(failTime + 1 > Time.fixedTime){
			warpParticles.startColor = new Color(255.0f,0.0f,0.0f);
		} else {
			warpParticles.startColor = new Color(0.0f,89.0f,107.0f);
		}
	}
	
	public float getTimeRemaining(){
		return (sceneEntryTime + maxTimeInScene) - Time.fixedTime;
	}
	
	public void hadAFail(){
		
		failTime = Time.fixedTime;
		AudioSource.PlayClipAtPoint(failSfx[ UnityEngine.Random.Range(0,failSfx.Length) ], theShip.transform.position);
		StartCoroutine(theShip.GetComponent<ShipCore>().damageShip((float)UnityEngine.Random.Range(3,10), "Broken apart by hyperspace disturbances"));
	}
	
	
	
	//start the exit process
	public IEnumerator startExit(bool failure){
		if(exiting == false){
			exiting = true;
			failing = failure;
			warpParticles.startColor = new Color(255.0f,0.0f,0.0f);
			//change animations
			//send an osc message /warp/failed {time to failure}
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
		}	
	}
	
	public override void SendOSCMessage(){	
		OSCMessage msg = new OSCMessage("/scene/warp/updatestats");
		msg.Append<float>(0.0f);		
		msg.Append<float>(getTimeRemaining());		
		msg.Append<int>(ps.forcedHyperspaceFail == true ? 1 : 0);
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
