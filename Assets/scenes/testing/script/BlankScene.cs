using UnityEngine;
using System;
using UnityOSC;

[System.Serializable]
public class BlankScene: GenericScene {
	

	GameObject theShip;


	public override void Start() {
		theShip = GameObject.Find("TheShip");
	

	}
	
	public void FixedUpdate() {
		
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
		
		
		switch(operation){
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
	
	
	
}