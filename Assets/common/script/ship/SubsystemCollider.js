#pragma strict

var targetSystem : String;
private var target : BaseSubsystem;
private var theShip : GameObject;

function Start () {
	theShip = GameObject.Find("TheShip");

	target = theShip.GetComponent(targetSystem);
	
	
}

function Update () {

}

function OnCollisionEnter(collision : Collision){
	if(collision.transform != theShip.transform){
		target.applyImpactDamage(collision.impactForceSum.magnitude);
		Debug.Log(collision.impactForceSum.magnitude);
		Debug.Log(collision.other.name);
	}
}