using UnityEngine;
using System;
using UnityOSC;

[System.Serializable]
public class NewDropScene : GenericScene {
	
	
	GameObject theShip;
	public Transform skyboxCamera;
	public Transform planet;
	
	public float moveSpeed = -1f;
	public float altitude = 0f;
	
	public override void Start() {
		theShip = GameObject.Find("TheShip");
		
		
	}
	
	public void FixedUpdate() {
		skyboxCamera.position -= new Vector3(0,0, moveSpeed);
		altitude = (skyboxCamera.position - planet.position).magnitude;
	}
	
	
	public override void configureClientScreens(){
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "plottingDisplay");			//give the engineer power man console
		
	}
	public override void ProcessOSCMessage(OSCPacket message){
		String[] msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		String target = msgAddress[2];
		String operation = msgAddress.Length > 2 ? msgAddress[3] : "";
		
		

	}
	
	
	
}