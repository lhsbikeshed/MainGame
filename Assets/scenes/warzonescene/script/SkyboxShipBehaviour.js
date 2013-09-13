#pragma strict

var velocity : Vector3; //ships velocity
var laserTarget : Transform;		//where are we firing.
var laserSweetAmount : float;	//how much the laser sweeps about when firing
var laserChargeTime : float;	//number of millis to charge beam for
var health : float = 100.0;


@HideInInspector

var nextShotTime : float; //next time to randomly target and fire at something
var state : int = 0;		//0 = alive, 1 = dying, 2 = dead



function Start () {
	nextShotTime = Random.Range(2,15);
}

function Update () {

}

function FixedUpdate(){
	if(state == 0){					//ALIVE FLY ABOUT AND SHOOT SHIT
		transform.position += transform.rotation * velocity;
		if(nextShotTime < Time.fixedTime){
			nextShotTime += Random.Range(2,15);
			var tgList : GameObject[] = GameObject.FindGameObjectsWithTag("skyboxShip");
			var rand : int = Random.Range(0, tgList.length);
			if(tgList[rand] != gameObject){
				fireAtTarget(tgList[rand].transform);
			}	
		}
	} else if(state == 1){			//DYING
	}
}

function damage(amt: float){
	health -= amt;
	
	if(health <=0){
		//BEGIN THE DEATH
		health = 0;
		state = 1;
	}

}

function fireAtTarget(){
	fireAtTarget(laserTarget);
}

function fireAtTarget(target : Transform){
	GetComponentInChildren.<LaserTurretBehaviour>().setTarget(target);
	GetComponentInChildren.<LaserTurretBehaviour>().startFiring();
}