using UnityEngine;
using System;
using System.Collections;


public class MissileFlareBehaviour:MonoBehaviour{
	
	public AudioClip[] sounds;
	public float flightDuration;	//how long we fly for before explodering
	public bool successful = false;
	
	ParticleSystem parts;
	int randomSound = 0;
	float creationTime;
	
	bool dying = false;
	
	Quaternion randomRotation;
	
	public void Start() {
		parts = GetComponentInChildren<ParticleSystem>();	
		randomSound = UnityEngine.Random.Range(0,sounds.Length);
		creationTime = Time.fixedTime;
		randomRotation = Quaternion.Euler(UnityEngine.Random.Range(-0.5f,0.5f), UnityEngine.Random.Range(-0.5f,0.5f),0.0f);
		
	}
	
	public void Update() {
		if(creationTime + flightDuration < Time.fixedTime){
			if(dying == false){
				dying = true;
				StartCoroutine(explode());
			}
		} else {
			
			transform.rotation *= randomRotation;
			transform.Translate(0.0f,0.0f,5.0f); 
			
		}
	}
	
	public IEnumerator explode(){
		if(parts == null){
			parts = GetComponentInChildren<ParticleSystem>();
		}
		if(successful){
			parts.Play();
		//GetComponent.<TrailRenderer>().enabled =
			UsefulShit.PlayClipAt(sounds[randomSound], transform.position);
		}
		yield return new WaitForSeconds(6.0f);
		Destroy(gameObject);
	}
}