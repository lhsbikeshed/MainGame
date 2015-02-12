using UnityEngine;
using System;


public class AirlockEffectBehaviour:MonoBehaviour{
	
	public ParticleSystem particles;
	public BlinkenFlareBehaviour[] lights;
	public AudioSource[] audioEffects;
	
	
	
	public void Start() {

		particles.enableEmission = false;
		

	}
	
	//amount of air in the chamber, from 0 - 1
	public void setAtmosphereLevel(float level){
	
		foreach(AudioSource s in audioEffects){
			s.volume = level;
		}
	
	}
	
	public void Update() {
	
	}
	
	public void start(){
		Debug.Log(gameObject.name);
		particles.enableEmission = true;
		foreach(BlinkenFlareBehaviour l in lights){
			l.blinking = true;
		}
		audioEffects[1].Play();
		
	}
	
	public void stop(){
		particles.enableEmission = false;
		foreach(BlinkenFlareBehaviour l in lights){
			l.blinking = false;
		}
	}
}