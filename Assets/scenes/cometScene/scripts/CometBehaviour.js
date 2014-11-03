#pragma strict




public var velocity : Vector3;
public var rotSpeed : Vector3;



function Start () {

}

function FixedUpdate(){
	transform.position += transform.TransformDirection(velocity); 
	transform.rotation = transform.rotation * Quaternion.Euler(rotSpeed);

}

function OnTriggerEnter(c : Collider){
	if(c.name == "skyboxCamera"){
		//we whomped the player, blow them up
		var theShip = GameObject.Find("TheShip");
		theShip.GetComponent.<ShipCore>().damageShip(1000, "Unplanned collision with Comet Surface");
	}
}