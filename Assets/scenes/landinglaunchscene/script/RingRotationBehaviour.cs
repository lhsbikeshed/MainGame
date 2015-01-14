using UnityEngine;
using System;


public class RingRotationBehaviour:MonoBehaviour{
	
	public float speed = 1.0f;
	
	Quaternion rot;
	public void Start() {
		rot = transform.rotation;
	}
	
	public void Update() {
	
	}
	
	public void FixedUpdate(){
		rot = Quaternion.Euler(speed, 0.0f, 0.0f);
		transform.rotation *= rot;
	}

}