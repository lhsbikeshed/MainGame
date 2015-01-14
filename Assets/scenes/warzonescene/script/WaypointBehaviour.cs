using UnityEngine;
using System;


public class WaypointBehaviour:MonoBehaviour{
	
	WaypointController wpController;
	
	public void Start() {
		wpController = GameObject.Find("SceneScripts").GetComponent<WaypointController>();
	}
	
	public void Update() {
	
	}
	
	public void OnTriggerEnter(Collider col){
		if(col.name == "TheShip"){
			wpController.gateDone(gameObject);
		}
	}
}

