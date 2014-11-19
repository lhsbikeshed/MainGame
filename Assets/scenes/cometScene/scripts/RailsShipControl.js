#pragma strict

var stickPos : Vector3;
var angleClampMin : Vector3;
var angleClampMax : Vector3;
var xVelocityLimit : float = 10;
var yVelocityLimit : float = 10;

var moveScale : float = 0.7f;

private var rotX : float;
private var rotY : float;
private var rotZ : float;

private var theShip : Transform;
private var initialShipRotation : Vector3;

var stability : float = 1.0f;
var speed : float = 1.0f;


/* lock the ship to this object, halt its movement*/
function Start () {
	theShip = GameObject.Find("TheShip").transform;
	theShip.parent = transform;
	theShip.rigidbody.constraints = RigidbodyConstraints.FreezePosition;
	initialShipRotation = theShip.localEulerAngles;
	PropulsionSystem.instance.enableSystem();
}

function OnDestroy(){
	theShip.parent = null;
	theShip.rigidbody.constraints = RigidbodyConstraints.None;

}

function FixedUpdate () {
	newMove();

}

function newMove(){
	stickPos = PropulsionSystem.instance.joyPos;
	//read the current rotation of the ship and project it onto our xy plane
	var shipRot : Vector3 = theShip.TransformDirection(Vector3.forward);
	var xVal = Vector3.Project(shipRot, transform.right);
	var yVal = Vector3.Project(shipRot, transform.up);
	
	transform.position += new Vector3(xVal.x, yVal.y, 0) * moveScale;
	
	var predictedFwd : Vector3 = Quaternion.AngleAxis(
         theShip.rigidbody.angularVelocity.magnitude * Mathf.Rad2Deg * stability / speed,
         theShip.rigidbody.angularVelocity
     ) * -theShip.transform.forward;
 
     var torqueVector : Vector3 = Vector3.Cross(predictedFwd, Vector3.forward);
     theShip.rigidbody.AddTorque(torqueVector * speed * speed);
     
	
	
	
}

function oldMove(){
	stickPos = PropulsionSystem.instance.joyPos;
	rotX += stickPos.x * 1.0f;
	rotY += stickPos.y * 1.0f;
	rotZ += stickPos.z;
	
	rotX = Mathf.LerpAngle(rotX, 0, 0.01f);	
	rotY = Mathf.LerpAngle(rotY, 0, 0.01f);
	
	
	
    rotY = Mathf.Clamp (rotY, angleClampMin.y, angleClampMax.y);
	rotX = Mathf.Clamp (rotX, angleClampMin.x, angleClampMax.x);
	var newRot : Vector3 = new Vector3(rotY, rotX, rotZ);
	            
    theShip.localEulerAngles =  initialShipRotation + newRot;
    
    var newPos : Vector3 = Vector3(newRot.y, -newRot.x, 0) * 0.01f;
    newPos = theShip.TransformDirection(newPos);
    newPos.z = 0;
    newPos.x = Mathf.Clamp(newPos.x, -xVelocityLimit, xVelocityLimit);
    newPos.y = Mathf.Clamp(newPos.y, -yVelocityLimit, yVelocityLimit);
    transform.position += newPos;
}