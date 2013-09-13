#pragma strict

private var theShip : Transform;


function Start () {
	theShip = GameObject.Find("TheShip").transform;
}

function OnTriggerEnter(c : Collider){
	

	var colliderVel : Vector3 = c.attachedRigidbody.velocity;

	Debug.Log("coll warnji9ng");
	var msg : OSCMessage = OSCMessage("/debrisscene/collisionwarning");
	OSCHandler.Instance.SendMessageToAll(msg);

	
}


function Update () {

	transform.position = theShip.position;
	

}