using UnityEngine;
using System;

[System.Serializable]
public class TestingScene: GenericScene {
	

	public int[] hyperspaceDestination;
	public GameObject hyperspaceEffects;
	float hyperspaceStartTime;
	
	GameObject theShip;
	bool inHyperspace = false;
	
	MapController mapController;
	public override void Start() {
		theShip = GameObject.Find("TheShip");
		mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();

	}
	
	public void FixedUpdate() {
		
	}
	
	
	public override void configureClientScreens(){
	
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a dockign comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
	
	}
}
