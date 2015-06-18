using UnityEngine;
using System;


public class BlinkenFlareBehaviour:MonoBehaviour{
	
	public float delay = 75.0f;
	public bool blinking = true;
	public float offset = 0.0f;
	float lastTime;
	public float startDelay = 75.0f;
	
	public bool dying = false;
	public float deadTime = 0.0f;
	
	public Transform target;
	
	Transform theShip;
	Material mat;
	bool state  =false;
	
	
	public void Start() {

		theShip = GameObject.Find("TheShip").transform;
		if (target == null) {
			target = theShip;
		}
		mat = GetComponentInChildren<Renderer>().material;
	//	Debug.Log(mat);
		if(blinking == false){
			var tmp_cs1 = mat.color;
            tmp_cs1.a = 0.0f;
            mat.color = tmp_cs1;
		}
	}
	
	public void flickerAndDie(){
		dying = true;
		deadTime = Time.fixedTime;
	}
	
	public void Update() {
		if(blinking){
			
				
			
			if(target == null){
				transform.LookAt(theShip);
			} else {
				transform.LookAt(target);
			}
		} 
	}
	
	public void FixedUpdate(){
		if(blinking){
			delay --;
			if(delay < 0){
				delay = startDelay;
				state = ! state;
			}
			
				
			if(state){	
				var tmp_cs2 = mat.color;
                tmp_cs2.a = 1.0f;
                mat.color = tmp_cs2;
			} else {
				var tmp_cs3 = mat.color;
                tmp_cs3.a = 0.0f;
                mat.color = tmp_cs3;
			}
			
		}
		if(dying ){
			if( deadTime + 1.5f < Time.fixedTime){
				blinking = false;
				dying = false;
				var tmp_cs4 = mat.color;
                tmp_cs4.a = 0.0f;
                mat.color = tmp_cs4;
			} else {
				var tmp_cs5 = mat.color;
                tmp_cs5.a = UnityEngine.Random.value;
                mat.color = tmp_cs5;
			}
		}
	}
}