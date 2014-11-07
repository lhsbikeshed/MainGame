﻿#pragma strict

/* base that crumbles and explodes */

public var rumbleSound : AudioClip;
public var finalExplosionSound : AudioClip;

public var bigExplosion : BigExplosionBehaviour;

public var rockParts : Transform[];
public var rockVelocity : Vector3[];

public var exploding : boolean = false;
public var explosionStartTime : float;


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
		if(Time.fixedTime - explosionStartTime < 90.0f){		//only separate the parts of the base for the first 90 seconds of the explosion
			for (var t = 0; t < rockVelocity.length; t++){
				rockParts[t].position += rockVelocity[t];
			}
		}
	}
}


function startFallingApart(){
	UsefulShit.PlayClipAt(rumbleSound, transform.position);
	exploding = true;
	gameObject.GetComponent.<Light>().intensity = 8.0f;
	explosionStartTime = Time.fixedTime;
	for(var ps : ParticleSystem in GetComponentsInChildren.<ParticleSystem>()){
		ps.enableEmission = true;
	}
	
	//start a particle effect too
}

function finalExplosion(){
	AudioSource.PlayClipAtPoint(finalExplosionSound, transform.position);
	bigExplosion.Explode();
	for (var t = 0; t < rockVelocity.length; t++){
		rockVelocity[t] *= 10.0f;
	}
}