using UnityEngine;
using System.Collections;
using UnityOSC;

public class PreloadScene : GenericScene {

	LogoSpinner logoSpinner;

	// Use this for initialization
	public override void Start () {
		logoSpinner = GameObject.Find("TitleSpinner").GetComponent<LogoSpinner>();
	
	}
	
	// Update is called once per frame
	public void FixedUpdate () {
		if(logoSpinner.done == true){
			Application.LoadLevel ("launch");
		}
	
	}

	IEnumerator startTheGame(){
		logoSpinner.doHide = true;
		
		yield return new WaitForSeconds (1f);
		GameObject.Find ("TitleText").SetActive(false);


	}

	public override void ProcessOSCMessage(OSCPacket message){
		
		string[] msgAddress = message.Address.Split(separator);
		// [1] = "scene", 2 = "scene name", 3 = thing
		string target = msgAddress[2];
		string operation = msgAddress.Length > 2 ? msgAddress[3] : "" + 0;
		
		
		switch(operation){
		case "start":
			StartCoroutine(startTheGame());
			break;
		}
	}


	public override void configureClientScreens(){
		
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "radar");			//give the pilot a radar comp
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "weapons");		//give the tactical a weapons screen
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "power");			//give the engineer power man console
		
	}
}
