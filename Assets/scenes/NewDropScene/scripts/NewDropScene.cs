using UnityEngine;
using System;
using UnityOSC;

[System.Serializable]
public class NewDropScene : GenericScene {
	
	
	GameObject theShip;
	public Transform skyboxCamera;
	public RailsShipControl railsShipController;
	public Transform planet;
	
	public float moveSpeed = -1f;
	public float altitude = 0f;
	public float sceneProgress = 0.0f;

	//approach state
	float minAltitudeTrigger = float.MaxValue;

	//orbit state

	//scene states
	public SceneState sceneState = SceneState.STATE_APPROACH;
	public enum SceneState { STATE_APPROACH, STATE_ORBIT, STATE_FAIL_SMALL, STATE_FAIL_BIG, STATE_OK};


	float initialShipToPlanetDistance = 0;

	public override void Start() {
		theShip = GameObject.Find("TheShip");
		initialShipToPlanetDistance = Mathf.Abs(planet.position.z - skyboxCamera.position.z);

		
	}
	
	public void FixedUpdate() {


		altitude = (skyboxCamera.position - planet.position).magnitude;
		switch(sceneState){
		case SceneState.STATE_APPROACH:
			doApproach();
			break;
		case SceneState.STATE_ORBIT:
			doOrbit();
			break;
		}
	}

	//fixed updates for approach to orbit
	private void doApproach(){
		//move closer to the planet
		skyboxCamera.position -= new Vector3(0,0, moveSpeed);


		if(altitude < minAltitudeTrigger){
			minAltitudeTrigger = altitude;
		} else {
			//we passed the min altitude trigger, start orbiting
			sceneState = SceneState.STATE_ORBIT;
		}
	}

	private void doOrbit(){
		skyboxCamera.RotateAround(planet.position, Vector3.right, -moveSpeed * 0.7f);

		//rotate the camera to match the surface, not technically correct but looks cool
		Vector3 normal = skyboxCamera.position - planet.position;
		Vector3 tangentForward = Vector3.Cross(normal, Vector3.right);
		Vector3 tangentUp = normal.normalized;
		tangentForward.Normalize();
		
		
		Quaternion direction = Quaternion.LookRotation(-tangentForward, tangentUp);
		railsShipController.setDirection(direction);

		skyboxCamera.position += tangentUp * PropulsionSystem.instance.scaledThrottle;







	}



	public override void SendOSCMessage(){
		//send out planet position updates as offset from ship position
		Vector3 planetOffset = planet.position - skyboxCamera.position;
		OSCMessage m = new OSCMessage("/system/slingshot/planetPosition");
		m.Append(planetOffset.x);
		m.Append (planetOffset.y);
		m.Append(planetOffset.z);
		OSCHandler.Instance.SendMessageToAll( m);


		//send our altitude
		OSCMessage msg = new OSCMessage("/ship/state/altitude");
		msg.Append(altitude);
		OSCHandler.Instance.SendMessageToAll(msg);

		//send a 0-1 value representing percentage of our progress to the start of orbiting


	}
	
	public override void configureClientScreens(){
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "slingshot");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "slingshot");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
		
	}
	public override void ProcessOSCMessage(OSCPacket message){
		String[] msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		String target = msgAddress[2];
		String operation = msgAddress.Length > 2 ? msgAddress[3] : "";
		
		

	}
	
	
	
}