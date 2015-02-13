using UnityEngine;
using System;
using UnityOSC;
using System.Collections;

[RequireComponent(typeof(AudioSource))]

public class LaunchSequencer:MonoBehaviour{
	
	public SequenceWaypoint[] waypoints;
	public int targetWaypoint = 0;
	public Transform objectToMove;
	public Transform clamp;
	Vector3 clampOffset;
	public float intitialPause = 5.0f;
	
	public bool canBeUsed = false;
	public GameObject objectToActivate;
	
	
	Vector3 startPos;
	Quaternion startRot;
	
	bool running = false;
	float startTime;
	
	public bool trigger = false;
	public float lerp = 0.0f;
	
	public void Start() {
		if(objectToMove == null){
			objectToMove = GameObject.Find("TheShip").transform;
		}	
		if(clamp != null){
			clampOffset = objectToMove.transform.position - clamp.position;
		}
	}
	
	public void OnTriggerEnter(Collider c){
		if(objectToMove != null && c.name == objectToMove.name && canBeUsed == false){
		
			canBeUsed = true;
			OSCMessage m = new OSCMessage("/scene/launchland/grabberState");
			m.Append<int>(1);
			OSCHandler.Instance.SendMessageToAll(m);
			if(objectToActivate){
				objectToActivate.SetActive(true);
			}
		}
		
	}
	
	public void OnTriggerExit(Collider c){
		if(c.name == objectToMove.name && canBeUsed == true){
		
			canBeUsed = false;
			OSCMessage m = new OSCMessage("/scene/launchland/grabberState");
			m.Append<int>(0);
			OSCHandler.Instance.SendMessageToAll(m);
			if(objectToActivate){
				objectToActivate.SetActive(false);
			}
		}
		
	}
	
	public IEnumerator begin(){
		if(! running && canBeUsed){
			yield return new WaitForSeconds (intitialPause);
			audio.clip = waypoints[0].inSound;
			audio.loop = false;
			audio.Play();
			startPos = objectToMove.transform.position;
			startRot = objectToMove.transform.rotation;
			targetWaypoint = 0;
			startTime = Time.fixedTime;
			objectToMove.rigidbody.constraints = RigidbodyConstraints.FreezeAll;
			running = true;
			
		}
	}
	
	
	
	public void FixedUpdate(){
		if(running){
			
		
			float duration =  waypoints[targetWaypoint].durationTo;
			float pause =  waypoints[targetWaypoint].pause;
			if(Time.fixedTime > startTime + duration){
				if(audio.clip != waypoints[targetWaypoint].outSound){
					audio.loop = false;
					audio.Stop();
					audio.clip = waypoints[targetWaypoint].outSound;
					audio.Play();
				}
				if(Time.fixedTime > startTime + duration + pause){
					if(targetWaypoint + 1 < waypoints.Length){
					
						targetWaypoint ++;
						startTime = Time.fixedTime;
						startPos = objectToMove.transform.position;
						startRot = objectToMove.transform.rotation;
						audio.loop = false;
						audio.Stop();
						audio.clip = waypoints[targetWaypoint].inSound;
						audio.Play();
					} else {
						UnityEngine.Debug.Log("done");
						
						
						running = false;
					}
				}
			} else {
				if(audio.isPlaying == false){
					audio.clip = waypoints[targetWaypoint].duringSound;
					audio.loop = true;
					audio.Play();
				}
				lerp = (Time.fixedTime - startTime) / duration;
				objectToMove.transform.position = Vector3.Lerp(startPos, waypoints[targetWaypoint].transform.position, lerp);
				objectToMove.transform.rotation = Quaternion.Slerp(startRot, waypoints[targetWaypoint].transform.rotation, lerp);
			
				if(clamp != null){
					clamp.transform.position = objectToMove.transform.position - clampOffset;
					clamp.transform.rotation = objectToMove.transform.rotation;
				}
			}
		}
	}
	
	public void Update() {
		if(trigger){
			trigger = false;
			StartCoroutine(begin());
		}
	}
}