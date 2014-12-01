#pragma strict

/* object that can exist in low and high detail universe Space
 * upon entering the trigger around the skybox camera move the object to high detail Space
 */
 
 
 // are we close to the player? if so scale everything up by 10
public var inDetailSpace = false;

public var startScale : Vector3;

private var theShip : Transform;
private var skyboxCamera :Transform;
public var currentScale = 0.02f;


function Start () {
	theShip = GameObject.Find("TheShip").transform;
	skyboxCamera = GameObject.Find("skyboxCamera").transform;
	

	startScale = transform.localScale;

}

function scaleParticles(){
	for(var pSys : ParticleSystem in gameObject.GetComponentsInChildren.<ParticleSystem>()){
		var particles : ParticleSystem.Particle[];
		var ct = pSys.GetParticles(particles);
		for(var i = 0; i < ct; i++){
			particles[ct].size *= currentScale;
			particles[ct].position *= currentScale;
		}
		pSys.SetParticles(particles,ct);
		pSys.startSize *= currentScale;
		pSys.startLifetime *= currentScale;
		
	
	}
}

function changeLayer(layer : LayerMask){
	for(var t :Transform in GetComponentsInChildren.<Transform>()){
	
		t.gameObject.layer = layer;
	}

}

function moveToDetailSpace(){
	currentScale =  MapController._instance.iUniverseScale;
	
	//get offset between the skyboxcamera and this object
	var offset = skyboxCamera.position - transform.position;
	offset *= currentScale;
	changeLayer( LayerMask.NameToLayer("Default"));
	
	
	transform.position = theShip.position - offset;
	
	transform.localScale *= currentScale;
	inDetailSpace = true;
	Debug.Log(gameObject.name + " entered detail");
	scaleParticles();
	
}

function moveToLowDetailSpace(){

	currentScale =  MapController._instance.universeScale;
	
	//get offset between the ship and this object
	var offset = theShip.position - transform.position;
	offset *= currentScale;
	changeLayer( LayerMask.NameToLayer("skybox"));
	transform.position = skyboxCamera.position - offset;
	
	transform.localScale = startScale;
	inDetailSpace = false;
	Debug.Log(gameObject.name + " left detail");
	//scale all particles to match
	scaleParticles();
}

function OnTriggerExit(col : Collider){
	
	if(col.name == "shipDetailBounds" && inDetailSpace == true){
		moveToLowDetailSpace();
	}
}

function OnTriggerEnter(col : Collider){

	if(col.name == "skyboxCamera" && inDetailSpace == false){
		moveToDetailSpace();
	}
}

