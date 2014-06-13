using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityOSC;
using System.Linq;


public class CablePuzzleSystem : MonoBehaviour {

	int[] sockets = {  
		2, 3, 6, 11, 8, 13};    
	int[] plugs = { 
		4, 5, 7, 9, 10, 12}; 

	PlugPair[] waitingList;


	public bool isRunning = false;
	public bool isWaiting = false;

	public bool puzzleComplete = false;

	float damageTimer = 0.0f;


	public bool test = false;
	// Use this for initialization
	void Start () {
		//pick 3 random sockets and 3 random plugs to connect, send the ID numbers to clients
		int[] plugWaitingList = randomFromArray(plugs, 3);
		int[] socketWaitingList = randomFromArray(sockets, 3);
		waitingList = new PlugPair[3];
		for(int i = 0; i < waitingList.Length; i++){
			waitingList[i] = new PlugPair();
			waitingList[i].plugId = plugWaitingList[i];
			waitingList[i].socketId = socketWaitingList[i];
			waitingList[i].ok = false;
		}

	}

	public void FixedUpdate(){
		if(test){
			isWaiting = true;
			test = false;
			puzzleStart();
		}
		if(isRunning){
			/* randomly flicker the damage effect */
			damageTimer -= Time.fixedDeltaTime;
			if(damageTimer < 0.0f){
				damageTimer = Random.Range (1.0f, 3.0f);
				OSCMessage msg = new OSCMessage("/ship/damage");	
				
				msg.Append(0);		
				
				OSCHandler.Instance.SendMessageToAll(msg);
			}
		}
	}

	public void puzzleStart(){
		if(!isWaiting || puzzleComplete){
			return;
		}
		//power off all screens
		//pick a random connection chain
		//send to engineer
		isRunning = true;
		isWaiting = false;
		OSCHandler.Instance.ChangeClientScreen("PilotStation", "cablepuzzle");
		OSCHandler.Instance.ChangeClientScreen("TacticalStation", "cablepuzzle");
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "cablepuzzle");

		//transmit the cable list
		string outLine = "";
		OSCMessage m = new OSCMessage("/system/cablePuzzle/connectionList");
		for(int i = 0; i < 3; i++){
			outLine = waitingList[i].plugId + ":" + waitingList[i].socketId;
			Debug.Log (outLine);

			m.Append(outLine);
		}
		OSCHandler.Instance.SendMessageToAll(m);

	}

	public void puzzleStop(){
		if(!isRunning ){ return; }

		isRunning = false;
		isWaiting = false;
		OSCHandler.Instance.RevertClientScreen("PilotStation");
	}


	/* plug was connected, ignore this if the puzzle isnt running
	 * check to see if the p:s pair is in our waiting list
	 * once all are connected then put everything back to normal*/
	private void plugConnected(int plugId, int sockId){
		if(!isRunning) return;
		int correctCount = 0;
		for(int i = 0; i < waitingList.Length; i++){

			if(waitingList[i].plugId == plugId && waitingList[i].socketId == sockId){
				//yay! its correct!
				Debug.Log ("YAY");
				waitingList[i].ok = true;
			}

			if(waitingList[i].ok){
				correctCount ++;
			}
		}
		if(correctCount == 3){
			puzzleComplete = true;

			puzzleStop();
		}
		Debug.Log (correctCount + "correct connections");


	}

	/* disconnected plug, check to see if its in a required list, if it is then shut something down */
	private void plugDisconnected(int plugId, int sockId){
		if(waitingList != null){
			for(int i = 0; i < waitingList.Length; i++){
				if(waitingList[i].plugId == plugId){
					waitingList[i].ok = false;
				}
			}
		}
		int correctCount = 0;
		foreach(PlugPair p in waitingList){
			if(p.ok){
				correctCount ++;
			}
		}
		if(puzzleComplete && correctCount < waitingList.Length){
			isWaiting = true;
			puzzleComplete = false;
			puzzleStart();
		}
	
	}

	public void processOSCMessage(OSCMessage m){
		string[] msgAddress = m.Address.Split('/');
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];

		if(operation == "startPuzzle"){
			isWaiting = true;
			Debug.Log ("CablePuzzle: waiting for damage");
		} else if (operation == "cancelPuzzle"){
			puzzleStop();
		} else if (operation == "connect"){
			int p = (int)m.Data[0];
			int s = (int)m.Data[1];
			plugConnected(p,s);

		} else if (operation == "disconnect"){
			int p = (int)m.Data[0];
			int s = (int)m.Data[1];
			plugDisconnected(p,s);
		}
	}

	private int[] randomFromArray(int[] items, int num){

		int i = items.Length;
		while( i > 1){
			i = i - 1;
			int j = Random.Range (0, i - 1);
			int sw = items[i];
			items[i] = items[j];
			items[j] = sw;
		}

		int[] ret = new int[num];
		for(int p = 0; p < num; p++){
			ret[p] = items[p];
		}
		return ret;
	}

	private struct PlugPair{
		public int plugId;
		public int socketId;
		public bool ok;
	}

}
