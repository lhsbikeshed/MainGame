using UnityEngine;
using System.Collections;
using UnityOSC;

public class RefuelScene : GenericScene {

	bool shipDocked = false;



	// Use this for initialization
	public override void Start () {
		//register a docking event listener
		GameObject.Find ("LandingSensor").GetComponent<LandingPad> ().dockStateChanged += shipDockChanged;


	}


	
	// Update is called once per frame
	public override void Update () {
	
	}



	public void shipDockChanged(bool state){

		shipDocked = state;
	}



	/* called when the scene is changed */
	public override void LeaveScene(){}
	
	public override void ProcessOSCMessage(OSCPacket msg ){
		string[] msgAddress = msg.Address.Split('/');
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];



	}
	
	public override void SendOSCMessage(){

	}
	
	/* send out osc messages for client screens */
	public override  void configureClientScreens(){
		//show the standard displays for the ship UNLESS the ship is in the dockign area

		OSCHandler.Instance.ChangeClientScreen ("PilotStation", "radar");
		if (shipDocked) {
				OSCHandler.Instance.ChangeClientScreen ("EngineerStation", "refuelDisplay");
		} else {
				OSCHandler.Instance.ChangeClientScreen ("EngineerStation", "power");
		}
			
		OSCHandler.Instance.ChangeClientScreen ("TacticalStation", "weapons");

	}
}
