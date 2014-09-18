#pragma strict

/* base that crumbles and explodes */

public var rumbleSound : AudioClip;

public var bigExplosion : BigExplosionBehaviour;

public var rockParts : Transform[];
public var rockVelocity : Vector3[];

public var exploding : boolean = false;


public var test : boolean = false;

function Start () {
	gameObject.GetComponent.<Light>().intensity = 0.0f;
	
}

function FixedUpdate () {
	if(test){
		test = false;
		if(!exploding){
			startFallingApart();
		} else {
			finalExplosion();
		}
	}
	if(exploding){
		for (var t = 0; t < rockVelocity.length; t++){
			rockParts[t].position += rockVelocity[t];
		}
	}
}


function startFallingApart(){
	UsefulShit.PlayClipAt(rumbleSound, transform.position);
	exploding = true;
	gameObject.GetComponent.<Light>().intensity = 8.0f;
	
	for(var ps : ParticleSystem in GetComponentsInChildren.<ParticleSystem>()){
		ps.enableEmission = true;
	}
	
	//start a particle effect too
}

function finalExplosion(){
	
	bigExplosion.Explode();
	for (var t = 0; t < rockVelocity.length; t++){
		rockVelocity[t] *= 10.0f;
	}
}