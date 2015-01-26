using UnityEngine;
using System;


public class ClampAnimator:MonoBehaviour{
	
	public bool test = false;
	public bool triggered = false;

	ParticleSystem[] particles;

	public void Start() {
		particles = GetComponentsInChildren<ParticleSystem>();

	}
	
	public void Update() {
		if(test){
			test = false;
			trigger();
		
		}
	}
	
	public void trigger(){
		if(triggered){ return; };
		triggered = true;
		foreach (ParticleSystem p in particles){
			p.Stop();
			p.Play();
		}
		foreach(Animation a in GetComponentsInChildren<Animation>()){
			a.Play("open");
		}
	}
}