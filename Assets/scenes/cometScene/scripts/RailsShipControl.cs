using UnityEngine;
using System;


public class RailsShipControl:MonoBehaviour{
	
	public Vector3 stickPos;	//joystick position from pilots console
	public Vector3 angleClampMin;
	public Vector3 angleClampMax;
	public float xVelocityLimit = 10.0f;
	public float yVelocityLimit = 10.0f;

	public float moveScale = 0.7f;
	//do we restrict movement to a plane?
	public bool restrictMovement = true;
	//do we force the ship to rotate to our forward?
	public bool restrictRotation = true;

	Vector3 bitsOffset;
	Transform bits;

	public Transform movementDirection;
	
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

		if(movementDirection == null){
			GameObject go=  new GameObject();
			go.name = "MovementDirection";
			go.transform.parent = transform;
			movementDirection = go.transform;
		}

		bits = transform.Find ("Bits");
		bitsOffset = bits.localPosition;
	}

	public void setDirection(Quaternion direction){
		movementDirection.rotation = direction;


	}
	
	public void OnDestroy(){
		theShip.parent = null;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
	
	}
	
	public void FixedUpdate() {
		if(restrictMovement) newMove();
		if(restrictRotation) doTorque();

		bits.position = transform.position + movementDirection.TransformDirection(bitsOffset);
		bits.LookAt(transform.position);
	}

	private void doTorque(){
		Vector3 predictedFwd = Quaternion.AngleAxis(
			theShip.rigidbody.angularVelocity.magnitude * Mathf.Rad2Deg * stability / speed,
			theShip.rigidbody.angularVelocity
			) * -theShip.transform.forward;
		
		Vector3 torqueVector = Vector3.Cross(predictedFwd, movementDirection.forward);
		theShip.rigidbody.AddTorque(torqueVector * speed * speed);
	}
	
	public void newMove(){
		stickPos = PropulsionSystem.instance.joyPos;
		//read the current rotation of the ship and project it onto our xy plane



		Vector3 shipRot = theShip.TransformDirection(Vector3.forward);
		Vector3 xVal = Vector3.Project(shipRot, movementDirection.right);
		Vector3 yVal = Vector3.Project(shipRot, movementDirection.up);
		
		transform.position += new Vector3(xVal.x, yVal.y, 0.0f) * moveScale;


	}


	public void OnDrawGizmos(){
		if(movementDirection != null){
			Gizmos.DrawLine(transform.position, transform.position + movementDirection.TransformDirection (-Vector3.forward*10));
		}
	}

}
