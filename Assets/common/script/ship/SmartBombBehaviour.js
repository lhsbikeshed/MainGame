#pragma strict

var sounds : AudioClip[];
var flightDuration : float;	//how long we fly for before explodering
var successful : boolean = false;

private var parts : ParticleSystem;
private var randomSound : int = 0;
private var creationTime : float;
private var theShip : Transform;

private var dying : boolean = false;

private var randomRotation : Quaternion;

function Start () {
	parts = GetComponent.<ParticleSystem>();	
	parts.Stop();
	randomSound = Random.Range(0,sounds.Length);
	creationTime = Time.fixedTime;
	randomRotation = Quaternion.Euler(Random.Range(-0.5,0.5), Random.Range(-0.5,0.5),0);
	theShip = GameObject.Find("TheShip").transform;
}

function Update () {
	if(creationTime + flightDuration < Time.fixedTime){
		if(dying == false){
			dying = true;
			
			explode();
		}
	} else {
		if(!dying){
			transform.rotation *= randomRotation;
			transform.Translate(0,0,5); 
		} 
		
	}
}

function explode(){
	if(parts == null){
		parts = GetComponent.<ParticleSystem>();
	}
	
	//find all incomingmissiles in range and exploderise them all
	var hitColliders = Physics.OverlapSphere(transform.position, 900);
        
    for (var i = 0; i < hitColliders.Length; i++) {
    //Debug.Log(hitColliders[i].name);
    	var t : TargettableObject = hitColliders[i].GetComponent.<TargettableObject>();
    	
    	if(t != null){
    		t.GetShot(100);
    	}
    }
	
	parts.Play();
	
	AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
	
	yield WaitForSeconds(6);
	Destroy(gameObject);
}