using UnityEngine;
using System;


public class ExplodingBaseBehaviour:MonoBehaviour{
	
	/* base that crumbles and explodes */
	
	public AudioClip rumbleSound;
	public AudioClip finalExplosionSound;
	
	public BigExplosionBehaviour bigExplosion;
	
	public Transform[] rockParts;
	public Vector3[] rockVelocity;
	
	public bool exploding = false;
	public float explosionStartTime;
	
	
	public bool test = false;
	
	public void Start() {
		gameObject.GetComponent<Light>().intensity = 0.0f;
		
	}
	
	public void FixedUpdate() {
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
				for(int t = 0; t < rockVelocity.Length; t++){
					rockParts[t].position += rockVelocity[t];
				}
			}
		}
	}
	
	
	public void startFallingApart(){
		UsefulShit.PlayClipAt(rumbleSound, transform.position);
		exploding = true;
		gameObject.GetComponent<Light>().intensity = 8.0f;
		explosionStartTime = Time.fixedTime;
		foreach(ParticleSystem ps in GetComponentsInChildren<ParticleSystem>()){
			ps.enableEmission = true;
		}
		
		//start a particle effect too
	}
	
	public void finalExplosion(){
		AudioSource.PlayClipAtPoint(finalExplosionSound, transform.position);
		bigExplosion.Explode();
		for(int t = 0; t < rockVelocity.Length; t++){
			rockVelocity[t] *= 10.0f;
		}
	}
}