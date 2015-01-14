using UnityEngine;
using System;


public class Station:MonoBehaviour{
	public Vector3 rotation;
	Quaternion rot;
	
	public bool rotating = false;
	
	public void Start() {
		rot = transform.rotation;
	
	}
	
	public void Update() {
		
	}
	
	public void FixedUpdate(){
		if(rotating){
			rot = Quaternion.Euler(rotation.x, rotation.y, rotation.z);
			transform.rotation *= rot;
		}
	}
}