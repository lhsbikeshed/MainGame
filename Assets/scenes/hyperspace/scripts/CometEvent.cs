using UnityEngine;
using System;
using System.Collections;


public class CometEvent:MonoBehaviour{
	
	public AudioClip gravityFailSfx;	//sound to play during failed exit
	
	GameObject theShip; //the ship
	bool running = false;
	
	float startTime = 0.0f;
	public float triggerTime = 11.0f;
	public Transform cometPrefab;
	
	public void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		cometPrefab.parent = null;
		startTime = Time.fixedTime;
	}
	
	public IEnumerator startSequence(){
		
		
		
		running = true;
		
		//start moving the asteroid
		cometPrefab.GetComponent<CometBehaviour>().velocity = new Vector3(0.0f,-24.9f,0.0f);
		yield return new WaitForSeconds(8f);
		cometPrefab.GetComponent<CometBehaviour>().velocity = new Vector3(0.0f,0.0f,0.0f);
		//yield WaitForSeconds(2f);
		AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
	}
	
	public void FixedUpdate() {
		if(running){
			
			
		}
		if(Time.fixedTime - startTime > triggerTime && !running){
			StartCoroutine(startSequence());
		}
	}
}
