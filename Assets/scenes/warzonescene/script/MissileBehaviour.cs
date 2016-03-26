using UnityEngine;
using System;
using System.Collections;


public class MissileBehaviour:MonoBehaviour{
	
	public AudioClip[] sounds;
	ParticleSystem parts;
	
	int randomSound = 0;
	public void Start() {
		randomSound = UnityEngine.Random.Range(0,sounds.Length);
		parts = GetComponentInChildren<ParticleSystem>();	
	
	}
	
	public void Update() {
	
	}
	
	public IEnumerator silentDie(){
		yield return new WaitForSeconds(6.0f);
		Destroy(gameObject);
	}
	public IEnumerator explode(){
		if(parts == null){
			parts = GetComponentInChildren<ParticleSystem>();
		}
		parts.Play();
		UsefulShit.PlayClipAt(sounds[randomSound], transform.position);
		yield return new WaitForSeconds(6.0f);
		Destroy(gameObject);
	}
}