using UnityEngine;
using System;


public class RailsShipControl:MonoBehaviour{
	
	public Vector3 stickPos;
	public Vector3 angleClampMin;
	public Vector3 angleClampMax;
	public float xVelocityLimit = 10.0f;
	public float yVelocityLimit = 10.0f;
	
	public float moveScale = 0.7f;
	
	float rotX;
	float rotY;
	float rotZ;
	
	Transform theShip;
	Vector3 initialShipRotation;
	
	public float stability = 1.0f;
	public float speed = 1.0f;
	
	
	/* lock the ship to this object, halt its movement*/
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		theShip.parent = transform;
		theShip.rigidbody.constraints = RigidbodyConstraints.FreezePosition;
		initialShipRotation = theShip.localEulerAngles;
		PropulsionSystem.instance.enableSystem();
	}
	
	public void OnDestroy(){
		theShip.parent = null;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
	
	}
	
	public void FixedUpdate() {
		newMove();
	
	}
	
	public void newMove(){
		stickPos = PropulsionSystem.instance.joyPos;
		//read the current rotation of the ship and project it onto our xy plane
		Vector3 shipRot = theShip.TransformDirection(Vector3.forward);
		Vector3 xVal = Vector3.Project(shipRot, transform.right);
		Vector3 yVal = Vector3.Project(shipRot, transform.up);
		
		transform.position += new Vector3(xVal.x, yVal.y, 0.0f) * moveScale;
		
		Vector3 predictedFwd = Quaternion.AngleAxis(
	         theShip.rigidbody.angularVelocity.magnitude * Mathf.Rad2Deg * stability / speed,
	         theShip.rigidbody.angularVelocity
	     ) * -theShip.transform.forward;
	 
	     Vector3 torqueVector = Vector3.Cross(predictedFwd, Vector3.forward);
	     theShip.rigidbody.AddTorque(torqueVector * speed * speed);
	     
		
		
		
	}
	
	public void oldMove(){
		stickPos = PropulsionSystem.instance.joyPos;
		rotX += stickPos.x * 1.0f;
		rotY += stickPos.y * 1.0f;
		rotZ += stickPos.z;
		
		rotX = Mathf.LerpAngle(rotX, 0.0f, 0.01f);	
		rotY = Mathf.LerpAngle(rotY, 0.0f, 0.01f);
		
		
		
	    rotY = Mathf.Clamp (rotY, angleClampMin.y, angleClampMax.y);
		rotX = Mathf.Clamp (rotX, angleClampMin.x, angleClampMax.x);
		Vector3 newRot = new Vector3(rotY, rotX, rotZ);
		            
	    theShip.localEulerAngles =  initialShipRotation + newRot;
	    
	    Vector3 newPos = new Vector3(newRot.y, -newRot.x, 0.0f) * 0.01f;
	    newPos = theShip.TransformDirection(newPos);
	    newPos.z = 0.0f;
	    newPos.x = Mathf.Clamp(newPos.x, -xVelocityLimit, xVelocityLimit);
	    newPos.y = Mathf.Clamp(newPos.y, -yVelocityLimit, yVelocityLimit);
	    transform.position += newPos;
	}
}
