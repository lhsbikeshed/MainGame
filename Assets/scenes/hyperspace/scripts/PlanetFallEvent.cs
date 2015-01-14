using UnityEngine;
using System;


public class PlanetFallEvent:MonoBehaviour{
	
	public Transform rotatorObject; //parent to the particles and ship for rotation goodness
	public AudioClip gravityFailSfx;	//sound to play during failed exit
	
	GameObject theShip; //the ship
	bool fallingTowardPlanet = false;
	
	float startTime = 0.0f;
	public float triggerTime = 25f;
	
	public void Start() {
		if(theShip == null){
			theShip = GameObject.Find("TheShip");
		}
		startTime = Time.fixedTime;
	}
	
	public void startSequence(){
		theShip.transform.parent = rotatorObject;
		
		GameObject.Find("warp bits").transform.parent = rotatorObject;
		
		
		
		AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
		fallingTowardPlanet = true;
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