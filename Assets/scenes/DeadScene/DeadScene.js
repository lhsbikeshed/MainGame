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
	
	public var leftCamera : Camera;
	public var rightCamera : Camera;
	
	var useExternalCamera : boolean = false;
	
	function Start () {
	
		var ratio : float = Screen.width / Screen.height;
		
		if(ratio > 1){
			useExternalCamera = true;
			Debug.Log("using preview camera");
			leftCamera.rect.x = 0.0f;
			leftCamera.rect.width = 0.5f;
			rightCamera.enabled = true;
			rightCamera.rect.x = 0.5f;
			rightCamera.rect.width = 0.5f;
			
			
			
		} else {
			leftCamera.rect.x = 0.0f;
			leftCamera.rect.width = 1.0f;
			rightCamera.enabled = false;
		
		}
		
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
		
		var g : GameObject = GameObject.Find("DynamicCamera");
		if(g != null){
			g.GetComponent.<DynamicCamera>().hideCabinCamera();
			g.GetComponent.<DynamicCamera>().canCabinCamBeUsed = false;
		}
	}
	
	function FixedUpdate () {
		if(sceneStartTime + 2.0f < Time.fixedTime && sentMessage == false){
			overlay.color.a = 0;
			AudioSource.PlayClipAtPoint(deadSound, Vector3(0,1,-10));
			sentMessage = true;
			GameObject.Find("CreditRoller").GetComponent.<CreditRoller>().scrolling = true;
			
		}


	}
	
	
	function ProcessOSCMessage(message : OSCPacket){
	}
	
	function SendOSCMessage(){
	}
	
}