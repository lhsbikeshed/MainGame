using UnityEngine;
using System;


public class SequenceWaypoint:MonoBehaviour, IComparable<SequenceWaypoint>{
	
	//for the crane grabber
	public bool translate  =false;
	public bool rotate = false;
	public float durationTo = 1.0f;
	public float pause = 1.0f;
	
	//for general flight
	public float newVelocity = 0.0f;
	public bool hyperOut = false;
	public bool visited = false;
	public float sensorDistance = 0.0f;
	public Transform matchRotation;
	
	public AudioClip inSound;
	public AudioClip outSound;
	public AudioClip duringSound;
	
	public Action<GameObject> OnArrive;
	
	public void Start() {
		OnArrive = DummyFunction;
	}
	
	public void Update() {
		if(matchRotation != null){
			transform.rotation = matchRotation.rotation;
		}
	
	}
	public int CompareTo(SequenceWaypoint other){
		return name.CompareTo(other.name);

	}


	
	public void DummyFunction(GameObject g){
	}
	
	//function OnArrive(gObj : GameObject){
	//}
	
	public void OnDrawGizmos(){
		Gizmos.color = Color.red;
		Gizmos.DrawWireSphere (transform.position, sensorDistance);
	}
}