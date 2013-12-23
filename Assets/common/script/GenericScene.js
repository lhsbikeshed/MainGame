#pragma strict

class GenericScene extends MonoBehaviour{

	
	var skyboxCameraActive : boolean = false; //does this scene use a skybox camera?

	var networkObjects : Component[]; 
	var rpcOnly : boolean[];
	protected var separator : char[] = ["/"[0]];
	
	
	
	function Start () {
	
	}
	
	function Update () {
	
	}
	
	
	function MapSectorChanged(oldSector: Vector3, newSector : Vector3){}
	
	
	function ProcessOSCMessage(msg : OSCPacket){}
	
	function SendOSCMessage(){}
	
	/* send out osc messages for client screens */
	function configureClientScreens(){}
	
}