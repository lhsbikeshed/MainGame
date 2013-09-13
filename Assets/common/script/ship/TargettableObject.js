#pragma strict

class TargettableObject  extends MonoBehaviour{
	var objectName : String;
	var stateText : String;
	var targetted : boolean = false;
	var targetId : int = 0;
	var scanCode : int = 1234;	//id to scan to target this missile
	
	
	var health : float = 1.0f;
	
	
	var statNames : String[];
	var statValues : float[];
	
	
	var baseDamage : float = 5.0f;
	var exploding : boolean  = false;
	var trackingPlayer : boolean = false;	//is this tracking the players movements?
	var damageable : boolean = true;
	var targettable : boolean  = true;
	var grappleable : boolean = false;
		
	
	var colour : Color;
	var visibleAtClient : boolean = true;
	var highlighted : boolean = false;
	
	
	
	function Start () {
		targetId = gameObject.GetHashCode();
		statNames = new String[2];
		statValues = new float[2];
		statNames[0] = "health";
		statNames[1] = " ";
		statValues[0] = 1;
		statValues[1] = 0;
	}
	
	function Update () {
	
	}
	
	function GetShot(damage : float){}
	
	
	function explode() : IEnumerator{}
	
	function gotGrappled() {}
	function releaseGrapple(){}
}