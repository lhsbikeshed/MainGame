using UnityEngine;
using System.Collections;
using UnityOSC;

public class ExplosionOverlayBehaviour : MonoBehaviour {
	
	
	
	public float cooldownTime; //how long to cool back to 0
	

	GUITexture material;
	float alpha = 0.0f;
	float startTime;
	bool  exploding = false;
	
	bool  heartBeatEnabled = false;
	private bool  inBeat = false;
	private float lastHeartBeat = 0;
	public AudioClip heartBeatSfx;
	float heartRate;
	
	GameObject explosionObject;
	public GameObject explosionPrefab;
	
	private Transform theShip;
	
	
	private int MODE_OFF = 0;
	private int MODE_EXPLODE = 1;
	private int MODE_DIE = 2;
	
	
	private int mode = 0;

	public static ExplosionOverlayBehaviour instance;
	
	void  Start (){
		instance = this;
		setupObject();
		
		
		theShip = GameObject.Find("TheShip").transform;
	}
	
	void  OnLevelWasLoaded ( int level  ){
		setupObject();
	}
	
	void  setupObject (){
		explosionObject = GameObject.Find("ExplosionOverlay");
		
		if(explosionObject == null){
			//create it
			explosionObject = Instantiate(explosionPrefab, new Vector3(0.5f,0.5f,0), Quaternion.identity) as GameObject;	
		}
		material = explosionObject.GetComponent<GUITexture>();
		Color c = material.color;
		c.a = 0;
		material.color = c;

	}
	
	public void  die (){
		alpha = 0.0f;
		startTime = Time.fixedTime;
		mode = MODE_DIE;
		cooldownTime = 2.0f;
	}
	public void  explode (){
		alpha = 1.0f;
		startTime = Time.fixedTime;
		exploding = true;
		mode = MODE_EXPLODE;
	}
	
	public void  setHeartRate ( float rate  ){
		if(rate <= 0.0f){
			heartBeatEnabled = false;
			material.color = new Color(0,0,0,0.0f);			
			
		} else {
			heartBeatEnabled = true;
			
			heartRate = rate;
			
		}
	}
	
	void  Update (){
		if(!heartBeatEnabled){
			if(mode == MODE_EXPLODE){
				material.color = new Color(255,255,255,alpha);
				alpha = Mathf.Lerp(1.0f, 0.0f, (Time.fixedTime - startTime) / cooldownTime);
				if(alpha <= 0.0f){
					alpha = 0.0f;
					exploding = false;
					mode = MODE_OFF;
					
				}
			} else if (mode == MODE_DIE){
				material.color = new Color(255,255,255,alpha);
				alpha = Mathf.Lerp(0.0f, 1.0f, (Time.fixedTime - startTime) / cooldownTime);
				if(alpha >= 1.0f){
					alpha = 1.0f;
					
					
				}
			}
		}
		
		
		if(heartBeatEnabled){
			if(lastHeartBeat + (1.0f / heartRate) < Time.fixedTime){
				
				lastHeartBeat = Time.fixedTime;
				if(inBeat == false){	//just play the sound once
					AudioSource.PlayClipAtPoint(heartBeatSfx, theShip.transform.position);
					OSCMessage msg = new OSCMessage("/ship/effect/heartbeat");
					OSCHandler.Instance.SendMessageToAll(msg);
					
				}
				inBeat = true;
			} else {
				inBeat = false;
				alpha = map(Time.fixedTime - lastHeartBeat, 0, 1.0f/heartRate/2, 1.0f, 0.0f);
				alpha = Mathf.Clamp(alpha,0.0f, 1.0f);
				material.color = new Color(0,0,0,alpha);			
			}
			
			if(inBeat){
				
			}
		}
		
		
		
		
	}
	
	
	float map ( float x ,   float in_min ,   float in_max ,   float out_min ,   float out_max  ){
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	
}



