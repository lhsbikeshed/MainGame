using UnityEngine;
using System;
using System.Collections;


public class CometEvent:HyperSpaceEvent{
	
	public AudioClip gravityFailSfx;	//sound to play during failed exit
	
	GameObject theShip; //the ship
	bool running = false;
	
	float startTime = 0.0f;
	//public float triggerTime = 11.0f;
	public Transform cometPrefab;

	Vector3 cometVel = Vector3.zero;

	
	public void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		cometPrefab.parent = null;
		startTime = Time.fixedTime;
		triggerDelay = 8.0f;
	}
	
	public override IEnumerator startSequence(){
		if(running == false){
			
			
			running = true;
			
			//start moving the asteroid
			cometVel = new Vector3(0.0f,-24.9f,0.0f);
			yield return new WaitForSeconds(8f);
			cometVel = new Vector3(0.0f,0.0f,0.0f);
			//yield WaitForSeconds(2f);
			UsefulShit.PlayClipAt(gravityFailSfx, transform.position);
		}
	}
	
	public void FixedUpdate() {
		if(running){
			cometPrefab.transform.position += cometPrefab.TransformDirection(cometVel);
			
		}

	}
}
