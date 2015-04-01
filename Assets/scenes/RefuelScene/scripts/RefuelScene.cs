using UnityEngine;
using System.Collections;
using UnityOSC;

public class RefuelScene : GenericScene {

	// Use this for initialization
	public override void Start () {
	
	}
	
	// Update is called once per frame
	public override void Update () {
	
	}

	/* called when the scene is changed */
	public override void LeaveScene(){}
	
	public override void ProcessOSCMessage(OSCPacket msg ){

	}
	
	public override void SendOSCMessage(){

	}
	
	/* send out osc messages for client screens */
	public override  void configureClientScreens(){
		//show the standard displays for the ship UNLESS the ship is in the dockign area

	}
}
