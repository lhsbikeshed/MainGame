using UnityEngine;
using System;


public class WaypointBehaviour:MonoBehaviour{
	
	WaypointController wpController;
	public int id = 0;
	
	public void Start() {
	}
	
	public void Update() {
	
	}

	public void setController(WaypointController wc){
		wpController = wc;
	}
	
	public void OnTriggerEnter(Collider col){
		if(col.name == "TheShip"){
			wpController.gateDone(gameObject);
		}
	}
}

