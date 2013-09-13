#pragma strict

var open : boolean = false;
var destinationScene : int = 4;
private var theShip : GameObject;

function Start () {
	theShip = GameObject.Find("TheShip");
}

function Update () {

}

function OnTriggerEnter(c : Collider){
	if(!open) { return; }
	Debug.Log(c.name);
	if(c.name == "body_low_001"){
		c.transform.parent.transform.position = Vector3(10000,10000,10400);
		Debug.Log("WEEEEEE!");
	} else if(c.name == "TheShip"){
		theShip.GetComponent.<ship>().inGate = true;
		
		theShip.GetComponent.<ship>().updateJumpStatus();
		
		theShip.GetComponent.<ship>().jumpDest = 1;
		var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
		ps.hyperspaceDestination = destinationScene;
		ps.forcedHyperspaceFail = false;
		Application.LoadLevel(1);
		Debug.Log("Started jump...");
	}
}


function OnTriggerExit (other : Collider) {
	
}