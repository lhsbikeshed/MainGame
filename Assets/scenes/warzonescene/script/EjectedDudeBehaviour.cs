using UnityEngine;
using System;


public class EjectedDudeBehaviour:MonoBehaviour{
	
	Transform childPlane;
	Transform theShip;
	float rotAmt = 0.0f;
	float createTime;
	Vector3 velocity;
	
	public void Start() {
		childPlane = GameObject.Find("Plane").transform;
		theShip = GameObject.Find("TheShip").transform;	
		velocity = theShip.rigidbody.velocity + theShip.transform.rotation * new Vector3(0.0f,0.0f,0.1f);
		createTime = Time.fixedTime;
	}
	
	public void Update() {
		rotAmt += 0.1f;
		//transform.rotation *= Quaternion.Euler(0,0,1);
		transform.position += velocity;
		childPlane.transform.LookAt(theShip.transform);
		childPlane.transform.rotation *= Quaternion.Euler(90.0f,0.0f,0.0f);
		if(createTime + 10 < Time.fixedTime){
			Destroy(gameObject);
		}
		
	}
}