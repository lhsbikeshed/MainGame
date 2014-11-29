#pragma strict
import System.Collections.Generic;

var childParts : List.<Transform>;

var trashed : boolean = false;
var trashedTimer : float = 0f;

function Start () {
	
}

function FixedUpdate () {
	if(trashed){
		trashedTimer += Time.fixedDeltaTime;
		if(trashedTimer > 4.0f){
			Destroy(gameObject);
		}
	}

}

function explode(source : Vector3){
	trashed = true;
	for(var t : Transform in childParts){
		t.rigidbody.constraints = RigidbodyConstraints.None;
		t.rigidbody.AddExplosionForce(5000f, source, 500f);
		
	}
}

function OnTriggerEnter(col : Collider){
	Debug.Log(col.gameObject.name);
	
	if(col.gameObject.name == "TheShip"){
		explode(col.rigidbody.transform.position);
	}

}