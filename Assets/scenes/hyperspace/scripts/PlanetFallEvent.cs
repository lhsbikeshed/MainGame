using UnityEngine;
using System;
using System.Collections;


public class PlanetFallEvent:HyperSpaceEvent{
	
	public Transform rotatorObject; //parent to the particles and ship for rotation goodness
	public AudioClip gravityFailSfx;	//sound to play during failed exit
	
	GameObject theShip; //the ship
	bool fallingTowardPlanet = false;
	
	float startTime = 0.0f;
//	public float triggerTime = 25f;
	
	public void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		startTime = Time.fixedTime;
	}


	public override IEnumerator startSequence(){
		theShip.transform.parent = rotatorObject;
		
		GameObject.Find("warp bits").transform.parent = rotatorObject;
		
		
		
		AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
		fallingTowardPlanet = true;
		yield return new WaitForSeconds(0);
	}
	
	public void FixedUpdate() {
		if(fallingTowardPlanet){
			
			rotatorObject.rotation = Quaternion.Euler(0.1f, 0.0f, 0.0f) * rotatorObject.rotation;
		}
		if(Time.fixedTime - startTime > triggerTime && !fallingTowardPlanet){
			startSequence();
		}
		
	}




}