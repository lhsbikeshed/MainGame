using UnityEngine;
using System.Collections;
using UnityOSC;

public class KeySwitchPuzzle : MonoBehaviour {

	public static KeySwitchPuzzle Instance;	

	public PuzzleState puzzleState = PuzzleState.OFF;
	public enum PuzzleState { OFF, WAITING, OK, FAIL };



	void Awake(){
		Instance = this;
	}

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void FixedUpdate () {
	
	}

	public void startPuzzle(){
		Debug.Log("Starting keyswitch puzzle");
		puzzleState = PuzzleState.WAITING;
		//change to the auth screens on each console
		//TODO
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "KeyAuth");
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "KeyAuth");
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "KeyAuth");


	}

	void pass(){
		if(puzzleState ==  PuzzleState.WAITING){
			Debug.Log ("Keyswitch Puzzle ok!");
			puzzleState = PuzzleState.OFF;
			//revert the screens
			OSCHandler.Instance.RevertClientScreen("EngineerStation");
			OSCHandler.Instance.RevertClientScreen("PilotStation");
			OSCHandler.Instance.RevertClientScreen("TacticalStation");
		}
	}
	void fail(){
		if(puzzleState ==  PuzzleState.WAITING){
			Debug.Log ("Keyswitch Puzzle failed!");
			//presumably its worth calling something to say the players failed here. For now just keep waiting for a success
		}
	}

	public void processOSCMessage (OSCMessage m){
		string[] msgAddress = m.Address.Split('/');
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		// /system/keyPuzzle/ok
		// /system/keyPuzzle/fail
		if(operation == "ok"){
			pass ();
		} else if (operation == "fail"){
			fail ();
		}



	}


	public static KeySwitchPuzzle GetInstance(){
		return Instance;
	}



}
