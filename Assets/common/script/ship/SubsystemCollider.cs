using UnityEngine;
using System;


public class SubsystemCollider:MonoBehaviour{
	
	public string targetSystem;
	BaseSubsystem target;
	GameObject theShip;
	
	public void Start() {
		theShip = GameObject.Find("TheShip");
	
		//target = theShip.GetComponent<TargettingSystem>();
		
		
	}
	
	public void Update() {
	
	}
	
	public void OnCollisionEnter(Collision collision){
		if(collision.transform != theShip.transform){
			target.applyImpactDamage(collision.impactForceSum.magnitude);
			UnityEngine.Debug.Log(collision.impactForceSum.magnitude);
			UnityEngine.Debug.Log(collision.other.name);
		}
	}
}
