#pragma strict

var sounds : AudioClip[];
var flightDuration : float;	//how long we fly for before explodering
var successful : boolean = false;

private var parts : ParticleSystem;
private var randomSound : int = 0;
private var creationTime : float;

private var dying : boolean = false;

private var randomRotation : Quaternion;

function Start () {
	parts = GetComponentInChildren.<ParticleSystem>();	
	randomSound = Random.Range(0,sounds.Length);
	creationTime = Time.fixedTime;
	randomRotation = Quaternion.Euler(Random.Range(-0.5,0.5), Random.Range(-0.5,0.5),0);
	
}

function Update () {
	if(creationTime + flightDuration < Time.fixedTime){
		if(dying == false){
			dying = true;
			explode();
		}
	} else {
		
		transform.rotation *= randomRotation;
		transform.Translate(0,0,5); 
		
	}
}

function explode(){
	if(parts == null){
		parts = GetComponentInChildren.<ParticleSystem>();
	}
	if(successful){
		parts.Play();
	//GetComponent.<TrailRenderer>().enabled =
		AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
	}
	yield WaitForSeconds(6);
	Destroy(gameObject);
}