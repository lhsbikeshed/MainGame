using UnityEngine;
using System;


public class DebrisBits:MonoBehaviour{
	
	public Transform theShip;
	public float scaleFactor;
	Quaternion startRot;
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		startRot = transform.localRotation;
	}
	
	public void FixedUpdate() {
	 	Vector3 vel = theShip.rigidbody.velocity;
	 	
		Quaternion q = Quaternion.Euler(vel.y * scaleFactor, -vel.x * scaleFactor,0.0f);
		transform.localRotation = Quaternion.RotateTowards(transform.localRotation, startRot * q,10f);
		
	}
}