#pragma strict

private var childPlane : Transform;
private var theShip : Transform;
private var rotAmt : float = 0;
private var createTime : float;
private var velocity : Vector3;

function Start () {
	childPlane = gameObject.Find("Plane").transform;
	theShip = GameObject.Find("TheShip").transform;	
	velocity = theShip.rigidbody.velocity + theShip.transform.rotation * Vector3(0,0,0.1);
	createTime = Time.fixedTime;
}

function Update () {
	rotAmt += 0.1f;
	//transform.rotation *= Quaternion.Euler(0,0,1);
	transform.position += velocity;
	childPlane.transform.LookAt(theShip.transform);
	childPlane.transform.rotation *= Quaternion.Euler(90,0,0);
	if(createTime + 10 < Time.fixedTime){
		Destroy(gameObject);
	}
	
}