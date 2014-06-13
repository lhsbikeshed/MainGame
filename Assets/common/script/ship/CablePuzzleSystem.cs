using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityOSC;


public class CablePuzzleSystem : MonoBehaviour {



	public bool isRunning = false;
	public bool isWaiting = false;

	// Use this for initialization
	void Start () {
	
	}

	public void triggerPuzzle(){
		if(!isWaiting){
			return;
		}
		//power off all screens
		//pick a random connection chain
		//send to engineer

	}

	public void processOSCMessage(OSCMessage m){
		string msgAddress = message.Address.Split("/");
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];

		if(operation == "startPuzzle"){
			isWaiting = true;
			Debug.Log ("CablePuzzle: waiting for damage");
		} 
	}
}
