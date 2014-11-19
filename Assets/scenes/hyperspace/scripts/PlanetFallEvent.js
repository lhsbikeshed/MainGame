#pragma strict


var rotatorObject : Transform; //parent to the particles and ship for rotation goodness
var gravityFailSfx : AudioClip;	//sound to play during failed exit

private var theShip : GameObject; //the ship
private var fallingTowardPlanet : boolean = false;

private var startTime : float = 0;
public var triggerTime : float = 25f;

function Start () {
	if(theShip == null){
		theShip = GameObject.Find("TheShip");
	}
	startTime = Time.fixedTime;
}

function startSequence(){
	theShip.transform.parent = rotatorObject;
	
	GameObject.Find("warp bits").transform.parent = rotatorObject;
	
	
	
	AudioSource.PlayClipAtPoint(gravityFailSfx, transform.position);
	fallingTowardPlanet = true;
}

function FixedUpdate () {
	if(fallingTowardPlanet){
		
		rotatorObject.rotation = Quaternion.Euler(0.1, 0.0, 0.0) * rotatorObject.rotation;
	}
	if(Time.fixedTime - startTime > triggerTime && !fallingTowardPlanet){
		startSequence();
	}
	
}



