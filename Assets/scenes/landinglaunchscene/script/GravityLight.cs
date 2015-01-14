using UnityEngine;
using System;



public class GravityLight:MonoBehaviour{
	
	public float rotationSpeed = 0.0f;
	
	public bool startOn = false;
	
	bool on = false;
	Light[] lights;
	
	public void Start() {
		lights = GetComponentsInChildren<Light>();
		setState(startOn);
	}
	
	public void FixedUpdate(){
		if(on){
			transform.localRotation *= Quaternion.Euler(rotationSpeed,0.0f,0.0f);
		}
	}
	
	
	public void setState(bool state){
	
		on = state;
		if(on){
			foreach(Light l in lights){
				l.color = new Color(1.0f,0.0f,0.0f);
			}
		} else {
			foreach(Light l in lights){
				l.color = new Color(0.0f,0.0f,0.0f);
			}
		}
	
	}
}