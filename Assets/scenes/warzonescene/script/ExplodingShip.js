#pragma strict

@HideInInspector
var frontPart : GameObject;
var backPart : GameObject;
var particles : ParticleSystem[];

var exploding : boolean;
var explodeTime : float;

function Start () {
	frontPart = GameObject.Find("DeadShip/front");
	backPart = GameObject.Find("DeadShip/back");
	particles = GetComponentsInChildren.<ParticleSystem>();
	
}

function Update () {
	if(exploding){
		if(explodeTime + 45 > Time.fixedTime){
			frontPart.transform.position += transform.rotation * Vector3(0.1,0,0);			
			backPart.transform.position -= transform.rotation * Vector3(0.1,0,0);
		} 
		frontPart.transform.rotation *= Quaternion.Euler(0.02,0,0);
		backPart.transform.rotation *= Quaternion.Euler(0.02,0,0);
	}

}

/* start the explodey particle effect
 * apply a kick to the two sections
 */
function startExplosion(){
	exploding = true;
	for(var p : ParticleSystem in particles){
		p.enableEmission = true;
	}
	explodeTime = Time.fixedTime;
}