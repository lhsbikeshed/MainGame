#pragma strict




public var velocity : Vector3;
public var rotSpeed : Vector3;

private var uniObj : UniverseObject;


function Start () {
	uniObj = GetComponent.<UniverseObject>();
}

function FixedUpdate(){
	var mod : float = 1f;
	if(uniObj.inDetailSpace){
		mod = 1f;
	} else {
		mod = 0.02f;
	}
	transform.position += transform.TransformDirection(velocity * mod); 
	transform.rotation = transform.rotation * Quaternion.Euler(rotSpeed);

}


function OnCollisionEnter(c : Collision){
	if(c.gameObject.name == "TheShip"){
		//we whomped the player, blow them up
		var theShip = GameObject.Find("TheShip");
		theShip.GetComponent.<ShipCore>().damageShip(1000, "Unplanned collision with Comet Surface");
	} 
		
}



