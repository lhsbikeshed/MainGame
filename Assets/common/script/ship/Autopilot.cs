using UnityEngine;
using System;
	using System.Collections.Generic;


public class Autopilot:MonoBehaviour{
	
	public List<SequenceWaypoint> waypointList;
	public SequenceWaypoint nextWaypoint;
	int waypointIndex = 0;
	
	public bool startTest = false;
	public float rotationDamping = 1.0f;
	public float maxVelocity = 15.0f;
	
	
	public bool running = false;
	float velocity = 0.0f;
	
	public Transform theShip;
	
	
	
	
	public void Start() {
		
			Transform ship = GameObject.Find("TheShip").transform;
			theShip = ship;
			
	}
	
	public void StartFlight(){
		if(waypointList.Count == 0){
			UnityEngine.Debug.Log("Autopilot started with no waypoints");
			return;
		}
		nextWaypoint = waypointList[0];
		running = true;
		waypointIndex = 0;
		theShip.GetComponent<ShipCore>().setControlLock(true);
		
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
		theShip.GetComponent<ShipCore>().setControlLock(false);
	}
	
	public bool isRunning() {
		return running;
	}
	
	public void AddWaypoint(SequenceWaypoint wp){
		waypointList.Add(wp);
	}
	
	
	
	public void Update() {
		
		if(startTest){
			startTest = false;
			StartFlight();
		}
		
	
	}
	
	public void FixedUpdate(){
		if(running){
			
			//var velocity : float = nextWaypoint.newVelocity;
			float dist = Mathf.Abs( (nextWaypoint.transform.position - theShip.transform.position).magnitude) ;
			velocity = Mathf.Clamp(dist,0.0f,maxVelocity);
			velocity *= Mathf.Abs(Vector3.Dot((theShip.transform.position - nextWaypoint.transform.position).normalized, theShip.transform.TransformDirection(Vector3.forward)));
			
			theShip.rigidbody.AddRelativeForce(Vector3.forward * velocity, ForceMode.Acceleration);
			
			Quaternion rotation = Quaternion.LookRotation(nextWaypoint.transform.position - theShip.transform.position, nextWaypoint.transform.TransformDirection(Vector3.up));
			//rotation.eulerAngles.z = 0;
			theShip.transform.rotation = Quaternion.Slerp(theShip.transform.rotation, rotation, Time.deltaTime * rotationDamping);
			
			
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
		} 
	}
}
