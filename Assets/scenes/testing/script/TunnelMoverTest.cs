using UnityEngine;
using System;


public class TunnelMoverTest:MonoBehaviour{
	
	public Vector3 moveSpeed;
	public Vector3 angleClampMin;
	public Vector3 angleClampMax;
	public float collisionTimer = 0.0f;
	public Transform theShip;
	public float stability = 51.0f;
	public float speed = 14.0f;
	
	public float velocity = 100f;
	public float moveScale = 10f;
	
	public Vector3 aimVector = Vector3.forward;
	
	
	public void Start() {
		//rigidbody.isKinematic = true;
		theShip = GameObject.Find("TheShip").transform;
		
	}
	
	public void FixedUpdate() {
		
		Vector3 predictedFwd = Quaternion.AngleAxis(
	         theShip.GetComponent<Rigidbody>().angularVelocity.magnitude * Mathf.Rad2Deg * stability / speed,
	         theShip.GetComponent<Rigidbody>().angularVelocity
	     ) * -theShip.transform.forward;
	 
	     Vector3 torqueVector = Vector3.Cross(predictedFwd, aimVector);
	     theShip.GetComponent<Rigidbody>().AddTorque(torqueVector * speed * speed);
	     
	     
	     Vector3 shipRot = theShip.TransformDirection(Vector3.forward);
		 Vector3 xVal = Vector3.Project(shipRot, Vector3.right);
		 Vector3 yVal = Vector3.Project(shipRot, Vector3.up);
		
		 theShip.GetComponent<Rigidbody>().AddForce( new Vector3(xVal.x, yVal.y, 0.0f) * moveScale, ForceMode.Acceleration);
	     
	     theShip.GetComponent<Rigidbody>().AddForce(Vector3.forward * velocity, ForceMode.Acceleration);
	     
		if(collisionTimer <= 0.0f){
			
		} else {
			collisionTimer -= Time.fixedDeltaTime;
		}
	
	}
	
	public void OnCollisionEnter(Collision c){
		UnityEngine.Debug.Log("Collision " + c.gameObject.name);
	}
}