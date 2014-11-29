#pragma strict

var moveSpeed : Vector3;
var angleClampMin : Vector3;
var angleClampMax : Vector3;
var collisionTimer : float = 0;
var theShip : Transform;
var stability : float = 51.0f;
var speed : float = 14.0f;

var velocity : float = 100f;
var moveScale = 10f;


function Start () {
	//rigidbody.isKinematic = true;
	theShip = GameObject.Find("TheShip").transform;
	
}

function FixedUpdate () {
	
	var predictedFwd : Vector3 = Quaternion.AngleAxis(
         theShip.rigidbody.angularVelocity.magnitude * Mathf.Rad2Deg * stability / speed,
         theShip.rigidbody.angularVelocity
     ) * -theShip.transform.forward;
 
     var torqueVector : Vector3 = Vector3.Cross(predictedFwd, Vector3.forward);
     theShip.rigidbody.AddTorque(torqueVector * speed * speed);
     
     
     var shipRot : Vector3 = theShip.TransformDirection(Vector3.forward);
	 var xVal = Vector3.Project(shipRot, Vector3.right);
	 var yVal = Vector3.Project(shipRot, Vector3.up);
	
	 theShip.rigidbody.AddForce( new Vector3(xVal.x, yVal.y, 0) * moveScale, ForceMode.Acceleration);
     
     theShip.rigidbody.AddForce(Vector3.forward * velocity, ForceMode.Acceleration);
     
	if(collisionTimer <= 0.0f){
		
	} else {
		collisionTimer -= Time.fixedDeltaTime;
	}

}

function OnCollisionEnter(c : Collision ){
	Debug.Log("Collision " + c.gameObject.name);
}