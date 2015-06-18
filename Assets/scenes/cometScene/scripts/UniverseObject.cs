using UnityEngine;
using System;


public class UniverseObject:MonoBehaviour{
	
	/* object that can exist in low and high detail universe Space
	 * upon entering the trigger around the skybox camera move the object to high detail Space
	 */
	 
	 // are we close to the player? if so scale everything up by 10
	public bool inDetailSpace = false;
	public bool lockInSkybox = false;	//do we permanently lock this in the skybox regardless of how close we get to it?
	
	public Vector3 startScale;
	
	Transform theShip;
	Transform skyboxCamera;
	public float currentScale = 0.02f;
	
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
		
	
		startScale = transform.localScale;
	
	}
	
	public void scaleParticles(){
		foreach(ParticleSystem pSys in gameObject.GetComponentsInChildren<ParticleSystem>()){
			ParticleSystem.Particle[] particles = null;
			int ct = pSys.GetParticles(particles);
			for(int i = 0; i < ct; i++){
				particles[ct].size *= currentScale;
				particles[ct].position *= currentScale;
			}
			pSys.SetParticles(particles,ct);
			pSys.startSize *= currentScale;
			pSys.startLifetime *= currentScale;
			
		
		}
	}
	
	public void changeLayer(LayerMask layer){
		foreach(Transform t in GetComponentsInChildren<Transform>()){
		
			t.gameObject.layer = layer;
		}
	
	}
	
	public void moveToDetailSpace(){
		if(lockInSkybox) return;


		currentScale =  MapController._instance.iUniverseScale;
		
		//get offset between the skyboxcamera and this object
		Vector3 offset = skyboxCamera.position - transform.position;
		offset *= currentScale;
		changeLayer( (LayerMask)LayerMask.NameToLayer("Default"));
		
		
		transform.position = theShip.position - offset;
		
		transform.localScale *= currentScale;
		inDetailSpace = true;
		UnityEngine.Debug.Log(gameObject.name + " entered detail");
		scaleParticles();
		
	}
	
	public void moveToLowDetailSpace(){
	
		currentScale =  MapController._instance.universeScale;
		
		//get offset between the ship and this object
		Vector3 offset = theShip.position - transform.position;
		offset *= currentScale;
		changeLayer( (LayerMask)LayerMask.NameToLayer("skybox"));
		transform.position = skyboxCamera.position - offset;
		
		transform.localScale = startScale;
		inDetailSpace = false;
		UnityEngine.Debug.Log(gameObject.name + " left detail");
		//scale all particles to match
		scaleParticles();
	}
	
	public void OnTriggerExit(Collider col){
		
		if(col.name == "shipDetailBounds" && inDetailSpace == true){
			moveToLowDetailSpace();
		}
	}
	
	public void OnTriggerEnter(Collider col){
	
		if(col.name == "skyboxCamera" && inDetailSpace == false){
			moveToDetailSpace();
		}
	}


}
