using UnityEngine;
using System;
using UnityOSC;

[System.Serializable]
public class DeadScene: GenericScene{

	public float sceneStartTime  =0.0f;
	public bool sentMessage = false;
	public GUITexture overlay;
	public PersistentScene ps;
	
	public AudioClip deadSound;
	public GUIText mainText;
	public GUIText subText;
	public AudioClip[] sounds;
	
	public Camera leftCamera;
	public Camera rightCamera;
	
	public bool useExternalCamera = false;
	
	public override void Start() {
	
		float ratio = (float)(Screen.width / Screen.height);
		
		if(OSCHandler.Instance.configItems["useChaseCam"] == "true"){
			Destroy(GameObject.Find("DynamicCamera"));
			useExternalCamera = true;
			UnityEngine.Debug.Log("using preview camera");
			var tmp_cs1 = leftCamera.rect;
            tmp_cs1.x = 0.0f;
            tmp_cs1.width = 0.5f;
            leftCamera.rect = tmp_cs1;
			rightCamera.enabled = true;
			var tmp_cs2 = rightCamera.rect;
            tmp_cs2.x = 0.5f;
            tmp_cs2.width = 0.5f;
            rightCamera.rect = tmp_cs2;
			
		} else {
			
			var tmp_cs3 = leftCamera.rect;
            tmp_cs3.x = 0.0f;
            tmp_cs3.width = 1.0f;
            leftCamera.rect = tmp_cs3;
			rightCamera.enabled = false;
		
		}
		Destroy(GameObject.Find("DynamicCamera"));
		Destroy(GameObject.Find("TheShip"));
		Destroy(GameObject.Find("ExplosionOverlay"));
		//cut the cabin lights
		// "end scene message"
		sceneStartTime = Time.fixedTime;
		ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
		//UsefulShit.PlayClipAt(deadSound, Vector3(0,1,-10));
		if(ps.survivedTheGame){
			mainText.text = "You Aren't Dead";
			subText.text = "you shortly to lead you to safety";
			deadSound = sounds[1];
			
			
			
		} else {
			deadSound = sounds[0];
		}
		
		GameObject g = GameObject.Find("DynamicCamera");
		if(g != null){
			g.GetComponent<DynamicCamera>().hideCabinCamera();
			g.GetComponent<DynamicCamera>().canCabinCamBeUsed = false;
		}
	}
	
	public void FixedUpdate() {
		if(sceneStartTime + 2.0f < Time.fixedTime && sentMessage == false){
			var tmp_cs4 = overlay.color;
            tmp_cs4.a = 0.0f;
            overlay.color = tmp_cs4;
			UsefulShit.PlayClipAt(deadSound, new Vector3(0.0f,1.0f,-10.0f));
			sentMessage = true;
			GameObject.Find("CreditRoller").GetComponent<CreditRoller>().scrolling = true;
			
		}


	}
	
	
	public override void ProcessOSCMessage(OSCPacket message){
	}
	
	public override void SendOSCMessage(){
	}
	
}

