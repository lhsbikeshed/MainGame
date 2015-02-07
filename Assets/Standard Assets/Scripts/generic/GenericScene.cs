using UnityEngine;
using System.Collections;
using UnityOSC;


/* base class for scene related things */
public class GenericScene : MonoBehaviour {

		
	public bool skyboxCameraActive = false; //does this scene use a skybox camera?
	public bool sceneIsJumpInterruption = false;	//is this scene midway through a jump sequence? If so then turn this on. The jump plotting
													//display will then show display an override screen instead of text entry


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
