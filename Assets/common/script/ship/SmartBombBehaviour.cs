using UnityEngine;
using System;
using System.Collections;


public class SmartBombBehaviour:MonoBehaviour{
	
	public AudioClip[] sounds;
	public float flightDuration;	//how long we fly for before explodering
	public bool successful = false;
	
	ParticleSystem parts;
	int randomSound = 0;
	float creationTime;
	Transform theShip;
	
	bool dying = false;
	
	Quaternion randomRotation;
	
	public void Start() {
		parts = GetComponent<ParticleSystem>();	
		parts.Stop();
		randomSound = UnityEngine.Random.Range(0,sounds.Length);
		creationTime = Time.fixedTime;
		randomRotation = Quaternion.Euler(UnityEngine.Random.Range(-0.5f,0.5f), UnityEngine.Random.Range(-0.5f,0.5f),0.0f);
		theShip = GameObject.Find("TheShip").transform;
	}
	
	public void Update() {
		if(creationTime + flightDuration < Time.fixedTime){
			if(dying == false){
				dying = true;
				
				StartCoroutine(explode());
			}
		} else {
			if(!dying){
				transform.rotation *= randomRotation;
				transform.Translate(0.0f,0.0f,5.0f); 
			} 
			
		}
	}
	
	public IEnumerator explode(){
		if(parts == null){
			parts = GetComponent<ParticleSystem>();
		}
		
		//find all incomingmissiles in range and exploderise them all
		Collider[] hitColliders = Physics.OverlapSphere(transform.position, 900.0f);
	        
	    for(int i = 0; i < hitColliders.Length; i++) {
	    //Debug.Log(hitColliders[i].name);
	    	TargettableObject t = hitColliders[i].GetComponent<TargettableObject>();
	    	
	    	if(t != null){
	    		t.ApplyDamage(DamageTypes.DAMAGE_EMP, 100.0f);
	    	}
	    }
		
		parts.Play();
		
		AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
		
		yield return new WaitForSeconds(6.0f);
		Destroy(gameObject);
	}
}
