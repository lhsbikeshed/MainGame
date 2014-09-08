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
	var visibleAtClient : boolean = true;	//is the object visible at the client end?
	var visibleAtTactical : boolean = false;	//visible for tactical?
	var visibleAtPilot : boolean = true;		//visible for pilot?
	var highlighted : boolean = false;
	
	
	
	function Start () {
		targetId = gameObject.GetHashCode();
		if(statNames == null || statValues == null){
			statNames = new String[2];
			statValues = new float[2];
		}
		statNames[0] = "health";
		
		statValues[0] = 1;
		
	}
	
	/* object statistic handlers, "stats" are things sent to the radar/tactical comp when in range*/	
	function getStatIdFromName(n : String) : int{
		for(var i = 0; i < statNames.Length; i++){
			if(statNames[i] == n){
				return i;
			}
		} 
		return -1;
	}
	
	function getStatFromName(s : String) : float {
		var ind = getStatIdFromName(s);
		if(ind != -1){
			return statValues[ind];
		}
		return -10000.0f;
	} 
	
	function setStatFromName(s : String, val : float){
		var ind = getStatIdFromName(s);
		if(ind != -1){
			statValues[ind] = val;
		}
	}
		
	
	function Update () {
	
	}
	
	function GetShot(damage : float){}
	
	
	function explode() : IEnumerator{}
	
	function onTarget(){}
	function onUnTarget(){}
	
	function gotGrappled() {}
	function releaseGrapple(){}
}