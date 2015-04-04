using UnityEngine;
using System;
using UnityOSC;


public class DockChamberScript:MonoBehaviour{
	
	public Transform theShip;
	public Transform matchTo;
	public bool ignoringCollisions  = false;
	public MeshCollider stationCollider;
	public bool gravityOn = false;
	public DoorScript dockingDoor;
	public bool inBay;
	
	public GravityLight[] bayLights;
	public AudioClip gravitySound;
	public AudioSource gravitySource;
	
	public float oxLevel = 1.0f;
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		if(stationCollider == null){
			stationCollider = transform.parent.GetComponent<MeshCollider>();
		}
		gravitySource = gameObject.AddComponent<AudioSource>();
		gravitySource.clip = gravitySound;
		gravitySource.Stop();
		gravitySource.loop = true;
		gravitySource.rolloffMode = AudioRolloffMode.Linear;
		gravitySource.maxDistance = 300.0f;
		if(dockingDoor == null){
			GameObject g = GameObject.Find ("BayDoor");
			dockingDoor = g.GetComponent<DoorScript>();
		}
	}
	
	public void setGravity(bool st){
		gravityOn = st;
		OSCMessage m = new OSCMessage("/scene/launchland/bayGravity");
		m.Append<int>( st == true ? 1 : 0 );
		OSCHandler.Instance.SendMessageToAll(m);
		
		if(gravityOn){
			foreach(GravityLight l in bayLights){
				l.setState(false);
			}
			gravitySource.Stop();
		} else {
			foreach(GravityLight l in bayLights){
				l.setState(true);
			}
			gravitySource.Play();
		}
	}
	
	public void FixedUpdate(){
		if(gravityOn && theShip.parent == transform){
			theShip.GetComponent<Rigidbody>().AddForce( transform.rotation * Vector3.up * -300, ForceMode.Force);
		}
		if(dockingDoor.state != DoorScript.DoorState.CLOSED){	//leak some atmosphere if the door isnt closed
			oxLevel -= 0.005f;
			if(oxLevel < 0){
				oxLevel = 0.0f;
			}
		} else {
			oxLevel += 0.01f;
			if(oxLevel > 1.0f){
				oxLevel = 1.0f;
			}
		}
		if(inBay){
			gravitySource.volume = oxLevel;
		} else {
			gravitySource.volume = 0.0f;
		}
		
	}
	
	public void OnTriggerStay(Collider other){
		//if(theShip.parent == null){	
		//	Debug.Log ("Stay");
		//	theShip.parent = transform;
		//}
	
	}

	public void openDoor(){
		
		if (dockingDoor != null){ 
	
	
			dockingDoor.openDoor();
			if(PersistentScene.networkReady == true){
				GetComponent<NetworkView>().RPC ("openDoor", RPCMode.Others);
			}
		}
		
	
	}
	
	public void closeDoor(){
		if (dockingDoor != null){ 
			dockingDoor.closeDoor();

		}
	}
	
	public void OnTriggerEnter(Collider other){
		Debug.Log ("Bay entered by " + other.name);
		if(other.name != "shipDetailBounds" && other.attachedRigidbody != null){
			if(other.attachedRigidbody.transform.name == "TheShip"){
				inBay = true;
				theShip.GetComponent<PropulsionSystem>().inBay = true;
				ignoringCollisions = true;

				theShip.GetComponent<ShipCore>().freezable = false;
				
				stationCollider.enabled = false;
				UnityEngine.Debug.Log("Enter : Disabled collider");
				if(theShip.parent == null){	//and were in contact with the docking bay
					theShip.parent = transform;

				}
			} else {
				other.attachedRigidbody.transform.parent = transform;
			}
		}
	
	}
	
	public void OnTriggerExit(Collider other){
		if(other.name == "shipDetailBounds") return;

		if(other.attachedRigidbody.transform.name == "TheShip" ){
			inBay = false;
			theShip.GetComponent<PropulsionSystem>().inBay = false;
			ignoringCollisions = false;
			theShip.GetComponent<ShipCore>().freezable = true;
			
			stationCollider.enabled = true;
			UnityEngine.Debug.Log("leave : enable collider");
			theShip.parent = null;
			

		} else {
			other.attachedRigidbody.transform.parent = null;
		}
		
	}

	
	
	public void Update() {
	
	}
}
