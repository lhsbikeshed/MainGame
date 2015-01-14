using UnityEngine;
using System;
	using System.Collections.Generic;

public class NPCShip:MonoBehaviour{
	
	public List<SequenceWaypoint> waypointList;
	public SequenceWaypoint nextWaypoint;
	int waypointIndex = 0;
	
	public bool startTest = false;
	public float rotationDamping = 1.0f;
	public float maxVelocity = 15.0f;
	
	public ShipsLaser shipsLaser;
	float laserCooldown = 1.0f;
	
	bool running = false;
	float velocity = 0.0f;
	
	 public bool reactorRunning = false;
	
	bool jumping = false;
	
	//refs
	public ParticleSystem engineParticles;
	public Light engineLight;
	
	
	public void Start() {
		engineParticles.emissionRate = 0.0f;
		engineLight.intensity = 0.0f;
	}
	
	public void StartFlight(){
		if(waypointList.Count == 0){
			UnityEngine.Debug.Log("Autopilot started with no waypoints");
			return;
		}
		nextWaypoint = waypointList[0];
		running = true;
		waypointIndex = 0;
		
	}
	
	public void startJump(){
		if(!jumping){
			GameObject.Find("JumpEffects").GetComponent<ParticleSystem>().enableEmission = true;
			jumping = true;
		}
	}
		
		
	public void SetAutopilotRoute(GameObject container){
		SequenceWaypoint[] wl = container.GetComponentsInChildren<SequenceWaypoint>();
		waypointList.Clear();
		foreach(SequenceWaypoint w in wl){
			waypointList.Add(w);
		}
		
	}
	
	public void PauseFlight(){
		running = false;
	}
	
	public bool isRunning() {
		return running;
	}
	
	public void AddWaypoint(SequenceWaypoint wp){
		waypointList.Add(wp);
	}
	
	public void SetReactorState(bool newState){
		if(newState != reactorRunning){
			if(newState){
				engineParticles.emissionRate = 50.0f ;
				engineLight.intensity = 1.0f ;
				foreach(BlinkenFlareBehaviour bf in GetComponentsInChildren<BlinkenFlareBehaviour>()){
					bf.blinking = true;
				}
				reactorRunning = true;
			
			} else {
				engineParticles.emissionRate = 0.0f;
				engineLight.intensity = 0.0f;
				foreach(BlinkenFlareBehaviour bf in GetComponentsInChildren<BlinkenFlareBehaviour>()){
					bf.flickerAndDie();
				}
				reactorRunning = false;
			}
		}
	}
	
	public void OnTriggerEnter(Collider c){
		TargettableObject target  = c.GetComponent<TargettableObject>();
		if(target != null && shipsLaser.getState() == 0 && target.damageable == true){
			shipsLaser.npcFireAtTarget(c.transform);
		}
	}
	
	
	public void Update() {
		if(reactorRunning){
			engineParticles.emissionRate = 50 + (velocity / maxVelocity) * 350;
			engineLight.intensity = 1 + (velocity / maxVelocity) * 3.5f;
		}
		
		
		if(startTest){
			startTest = false;
			startJump();
		}
		
	
	}
	
	public void FixedUpdate(){
		if(running){
			
			//var velocity : float = nextWaypoint.newVelocity;
			float dist = Mathf.Abs( (nextWaypoint.transform.position - transform.position).magnitude) ;
			velocity = Mathf.Clamp(dist,0.0f,maxVelocity);
			velocity *= Mathf.Abs(Vector3.Dot((transform.position - nextWaypoint.transform.position).normalized, transform.TransformDirection(Vector3.forward)));
			rigidbody.AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
			Quaternion rotation = Quaternion.LookRotation(nextWaypoint.transform.position - transform.position, nextWaypoint.transform.TransformDirection(Vector3.up));
			//rotation.eulerAngles.z = 0;
			transform.rotation = Quaternion.Slerp(transform.rotation, rotation, Time.deltaTime * rotationDamping);
			
			
			if( dist < nextWaypoint.sensorDistance && nextWaypoint.visited == false ){
				UnityEngine.Debug.Log("Reached waypoint: " + waypointIndex);
				nextWaypoint.visited = true;
				if(nextWaypoint.OnArrive != null){
							
					nextWaypoint.OnArrive(gameObject);
				}
				if(waypointIndex + 1 >= waypointList.Count){
					running = false;
					velocity = 0.0f;
				} else {
					
					waypointIndex ++;
					nextWaypoint = waypointList[waypointIndex];
					maxVelocity = nextWaypoint.newVelocity;
				}
				
				
				
			}
		} else if (jumping){
			rigidbody.AddRelativeForce(Vector3.forward * 500, ForceMode.Acceleration);
		}
	}
}
