#pragma strict


var gravityFailSfx : AudioClip;	//sound to play during failed exit

private var theShip : GameObject; //the ship
private var running : boolean = false;

private var startTime : float = 0;
public var triggerTime : float = 11;
public var cometPrefab : Transform;

function Start () {
	if(theShip == null){
		theShip = GameObject.Find("TheShip");
	}
	cometPrefab.parent = null;
	startTime = Time.fixedTime;
}

function startSequence(){
	
	
	
	running = true;
	
	//start moving the asteroid
	cometPrefab.GetComponent.<CometBehaviour>().velocity = Vector3(0,-24.9,0);
	yield WaitForSeconds(8f);
	cometPrefab.GetComponent.<CometBehaviour>().velocity = Vector3(0,0,0);
	//yield WaitForSeconds(2f);
	AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
}

function FixedUpdate () {
	if(running){
		
		
	}
	if(Time.fixedTime - startTime > triggerTime && !running){
		startSequence();
	}
}