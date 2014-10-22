using UnityEngine;
using System.Collections;
using UnityOSC;


public class GenericScene : MonoBehaviour {

		
	public bool skyboxCameraActive = false; //does this scene use a skybox camera?


	protected char[] separator = {'/'};



	public virtual void Start () {
		
	}

	public virtual void Update () {
		
	}

	/* called when the scene is changed */
	public virtual void LeaveScene(){}

	public virtual void MapSectorChanged(Vector3 oldSector , Vector3 newSector){}


	public virtual void ProcessOSCMessage(OSCPacket msg ){}

	public virtual void SendOSCMessage(){}

	/* send out osc messages for client screens */
	public virtual  void configureClientScreens(){}
		

}
