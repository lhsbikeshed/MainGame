using UnityEngine;
using System;


public class AirlockEffectBehaviour:MonoBehaviour{
	
	ParticleSystem particles;
	BlinkenFlareBehaviour[] lights;
	AudioSource[] audioEffects;
	
	
	
	public void Start() {
		particles = GetComponent<ParticleSystem>();
		particles.enableEmission = false;
		
		lights = GetComponentsInChildren<BlinkenFlareBehaviour>();
		
		audioEffects = GetComponentsInChildren<AudioSource>();
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