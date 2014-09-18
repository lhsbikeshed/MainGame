#pragma strict

@HideInInspector
var frontPart : GameObject;
var backPart : GameObject;
var particles : ParticleSystem[];

var exploding : boolean;
var explodeTime : float;

var largeExplosionPrefab : Transform;
var sparks : GameObject;

var onFire : boolean = false;

function Start () {
	frontPart = GameObject.Find("DeadShip/front");
	backPart = GameObject.Find("DeadShip/back");
	particles = GetComponentsInChildren.<ParticleSystem>();
	sparks = GameObject.Find("DeadShip/sparks");
	sparks.SetActive(false);
	
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
	if(onFire){
		frontPart.transform.rotation *= Quaternion.Euler(0.04,0,0);
		backPart.transform.rotation *= Quaternion.Euler(0.04,0,0);
	}

}

function startFireEffects(){
	for(var p : ParticleSystem in particles){
		p.enableEmission = true;
	}
	sparks.SetActive(true);
	onFire = true;
}

/* final death explosion
 */
function startExplosion(){
	exploding = true;
	
	explodeTime = Time.fixedTime;
	var t = transform.Find("BigExplosion").gameObject;
		
	t.GetComponent.<BigExplosionBehaviour>().Explode();

		
	
}