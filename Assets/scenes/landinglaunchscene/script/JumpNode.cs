using UnityEngine;
using System;


public class JumpNode:MonoBehaviour{
	
	//var destinationScene : int;
	public int jumpNodeFrequency;
	public bool forcedFail; //do we force a failure on this jump?
	
	
	public bool gateEnabled = true;
	
	
	public bool test = false;
	
	
	
	GameObject theShip;
	OSCSystem oscSender;
	
	
	
	public void Start() {
		theShip = GameObject.Find("TheShip");
		oscSender = GameObject.Find("PersistentScripts").GetComponent<OSCSystem>();
	}
	
	
	public void OnTriggerEnter(Collider other) {
		if(gateEnabled){
			if (other.gameObject == theShip){
				theShip.GetComponent<JumpSystem>().inGate = true;
				
				theShip.GetComponent<JumpSystem>().updateJumpStatus();
				
				PersistentScene ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
				
				ps.forcedHyperspaceFail = forcedFail;
				
				
				
			} 
		}
	}
	
	public void explode(){
		//stop rotation
		RingRotationBehaviour[] rr = GetComponentsInChildren<RingRotationBehaviour>();
		foreach(RingRotationBehaviour p in rr){
			p.speed = 0.0f;
		}
		
		BlinkenFlareBehaviour[] bf = GetComponentsInChildren<BlinkenFlareBehaviour>();
		foreach(BlinkenFlareBehaviour b in bf){
			b.blinking = false;
			b.flickerAndDie();
		}
		
		//disable collider
		Collider c = GetComponentInChildren<Collider>();
		c.enabled = false;
		
		ParticleSystem part = GetComponentInChildren<ParticleSystem>();
		part.enableEmission = false;
		
		
		
		foreach(Transform t in GetComponentsInChildren<Transform>()){
			UnityEngine.Debug.Log(t.name);
			if(t.name.Contains("Plane")){
				t.parent = null;
				t.gameObject.AddComponent<Rigidbody>();
				t.rigidbody.useGravity = false;
				t.rigidbody.AddForce( (transform.position - t.position).normalized * -10, ForceMode.Impulse);
				t.rigidbody.AddTorque(new Vector3(0.0f,40.0f,0.0f), ForceMode.Impulse);
				
				
			}
		}
		
		
		
	}
		
	
	
	public void OnTriggerExit(Collider other) {
		
		if (other.gameObject == theShip){
			theShip.GetComponent<JumpSystem>().inGate = false;
		    theShip.GetComponent<JumpSystem>().updateJumpStatus();
			
		} 
	}
	public void Update() {
		if(test){
			test = false;
			explode();
		}
		//transform.rotation *= Quaternion.Euler(0.01,0,0);
	}
}