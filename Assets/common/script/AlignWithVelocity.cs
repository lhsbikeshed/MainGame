using UnityEngine;
using System;


public class AlignWithVelocity:MonoBehaviour{
	public Transform target;
	public float distance;
	
	
	
	public void Start() {
		if(target == null){
			target = GameObject.Find("TheShip").transform;
		}
	}
	
	public void Update() {
		transform.position = target.transform.position + (target.rigidbody.velocity.normalized * distance);
		
		transform.LookAt(target);
		transform.rotation *= Quaternion.Euler(180.0f,0.0f,0.0f);
		
		
	}
}