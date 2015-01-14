using UnityEngine;
using System;


public class DoorTrigger:MonoBehaviour{
	public DockChamberScript dockChamber;
	
	
	public void Start() {
	
	}
	
	public void OnTriggerExit(Collider collider){
		if(collider.name == "TheShip"){
			dockChamber.closeDoor();
			GameObject.Find("AmbientLight").GetComponent<Light>().enabled = true;
		}
		
	}
	
	public void Update() {
	
	}
}
