#pragma strict

var velocity : Vector3; //ships velocity
var laserTarget : Transform;		//where are we firing.
var laserSweetAmount : float;	//how much the laser sweeps about when firing
var laserChargeTime : float;	//number of millis to charge beam for

var laserLines : Transform;

@HideInInspector
var engineParticles : ParticleSystem[];
var hyperPrefab : Transform;


var rotating : boolean = false;

function Start () {
	//setHidden(true);
}

function Update () {

}

function setHidden(hidden : boolean){
	var mesh : MeshRenderer[] = GetComponentsInChildren.<MeshRenderer>();
		for(var m :MeshRenderer in mesh){
			m.enabled = !hidden;
		}
		
		var ps : ParticleSystem[] = GetComponentsInChildren.<ParticleSystem>();
		for (var s : ParticleSystem in ps){
			s.gameObject.active = !hidden;
		}
}

function go(){
	//var hyperEntry : Transform = Instantiate (hyperPrefab, transform.position + transform.TransformDirection(Vector3.right) * 320, Quaternion.Euler(0,-90,0) * transform.rotation);
	
	//hyperEntry.particleSystem.Play();
	//yield WaitForSeconds(1.5);
	//velocity = Vector3(1.8,0,0);
	//setHidden(false);
	//yield WaitForSeconds(7);
	//hyperEntry.particleSystem.Stop();
	//yield WaitForSeconds(5);
	//Destroy(hyperEntry.gameObject);
	
	//trigger the big ass laser
	
}

function exit(){
	laserLines.active = false;
	velocity = Vector3(12,0,0);
	rotating = true;
	yield WaitForSeconds(5);
	rotating = false;
	velocity = Vector3(52,0,0);
	yield WaitForSeconds(10);
	
	var hyperEntry : Transform = Instantiate (hyperPrefab, transform.position + transform.TransformDirection(Vector3.right) * 283, Quaternion.Euler(0,-90,0) * transform.rotation);
	
	hyperEntry.particleSystem.Play();
	yield WaitForSeconds(8);
	setHidden(true);
	
	hyperEntry.particleSystem.Stop();
	yield WaitForSeconds(3);
	Destroy(hyperEntry.gameObject);
	Destroy(gameObject);
}

function FixedUpdate(){
	rigidbody.AddForce(transform.TransformDirection(velocity), ForceMode.Acceleration);
	if(rotating){
		rigidbody.AddRelativeTorque(Vector3(0,0,-0.05f));
	}
	
}

function fireAtTarget(){
	fireAtTarget(laserTarget);
}

function fireAtTarget(target : Transform){
	GetComponentInChildren.<LaserTurretBehaviour>().setTarget(target);
	GetComponentInChildren.<LaserTurretBehaviour>().duration = 2.5f;
	GetComponentInChildren.<LaserTurretBehaviour>().startFiring();
}