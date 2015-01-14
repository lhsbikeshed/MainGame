using UnityEngine;
using System;
using UnityOSC;


public class PersistentScene:MonoBehaviour{
	public static bool networkEnabled = true;
	public static bool networkReady = false;
	/* global things that persist between scenese
	*/
	public int hyperspaceDestination; //destination for our hyperspace exit
	public bool forcedHyperspaceFail; //do we force a failure?
	public bool useNetwork = true;
	public string deathReason = "";
	public bool survivedTheGame = false;
	
	public string pilotName = "pilotname";
	public string tacticalName = "tacticalname";
	public string engineerName = "engineername";
	public string captainName = "captainname";
	public string gmName = "gmname";
	
	
	public static PersistentScene _instance;
	
	
	
	[HideInInspector]
	
	
	
	
	public void Awake(){
		DontDestroyOnLoad(this);
		networkEnabled = useNetwork;
		_instance = this;
	}
	
	public void Start() {
		if(useNetwork == false){
			networkReady = false;
		}
		Screen.showCursor = false;
	
	}
	
	public void Update() {
	
	}
	public void gameWin(){
		survivedTheGame = true;
		Application.LoadLevel(5);
	}
	
	/* we died, do the global OHYOUBEDEAD things */
	public void shipDead(string reasonText){
		OSCMessage msg = new OSCMessage("/scene/youaredead");
		msg.Append<String>(reasonText);
		OSCHandler.Instance.SendMessageToAll(msg);
		deathReason = reasonText;
		Application.LoadLevel(5);
	
	}
}