#pragma strict

class DeadScene extends GenericScene{

	var sceneStartTime : float  =0;
	var sentMessage : boolean = false;
	public var  overlay : GUITexture;
	public var ps : PersistentScene;
	
	public var deadSound : AudioClip;
	public var mainText :GUIText;
	public var subText :GUIText;
	public var sounds : AudioClip[];
	
	
	function Start () {
		
		Destroy(GameObject.Find("TheShip"));
		Destroy(GameObject.Find("ExplosionOverlay"));
		//cut the cabin lights
		// "end scene message"
		sceneStartTime = Time.fixedTime;
		ps = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
		//AudioSource.PlayClipAtPoint(deadSound, Vector3(0,1,-10));
		if(ps.survivedTheGame){
			mainText.text = "You Arent Dead";
			subText.text = "you shortly to lead you to safety";
			deadSound = sounds[1];
		} else {
			deadSound = sounds[0];
		}
	}
	
	function FixedUpdate () {
		if(sceneStartTime + 2.0f < Time.fixedTime && sentMessage == false){
			overlay.color.a = 0;
			AudioSource.PlayClipAtPoint(deadSound, Vector3(0,1,-10));
			sentMessage = true;
		}


	}
	
	
	function ProcessOSCMessage(message : OSCPacket){
	}
	
	function SendOSCMessage(){
	}
	
}