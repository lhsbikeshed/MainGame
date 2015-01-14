using UnityEngine;
using System;


public class ClampAnimator:MonoBehaviour{
	
	public bool test = false;
	public bool triggered = false;
	public void Start() {
	
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
		foreach(Animation a in GetComponentsInChildren<Animation>()){
			a.Play("open");
		}
	}
}