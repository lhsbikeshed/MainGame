using UnityEngine;
using System;


public class TargetTrackController:MonoBehaviour{
	
	public Transform controlPoint;
	public int numberOfTargets;
	public Transform targetObject;
	public Transform destPoint;
	public Transform srcPoint;
	public Transform[] objectList;
	
	Transform theShip;
	
	public void Start() {
		
		
		theShip = GameObject.Find("TheShip").transform;	
		
		objectList = new Transform[numberOfTargets];
			
		generateTrack();
		
	}
	
	public void generateTrack(){
		Vector3 thisPoint = Vector3.zero;
		if (destPoint == null){
			destPoint = GameObject.Find("TheShip").transform;
		}
		for(int i = 1; i < objectList.Length; i++){
			//work out where this should be
			thisPoint = Bezier2(srcPoint.position, controlPoint.position, destPoint.position, 0.001f + (1.0f/numberOfTargets) * i);
			
		
			objectList[i] = (UnityEngine.Transform)Instantiate(targetObject,thisPoint, Quaternion.identity);
			objectList[i].name = objectList[i].name + i;
			
			foreach(BlinkenFlareBehaviour t in objectList[i].GetComponentsInChildren<BlinkenFlareBehaviour>()){
				t.startDelay = 60.0f;
				t.delay = (float)(i * (60 / objectList.Length));
			}
				
			
		}
		
		for(int b = 1; b < objectList.Length - 1; b++){
			objectList[b].LookAt(objectList[b+1].transform);
		}
		objectList[objectList.Length - 1].LookAt(destPoint);
		
		
		
		
	}
	public void FixedUpdate() {
	
	
	}
	
	//shamelessly stolen from unity forums..
	public Vector3 Bezier2(Vector3 Start,Vector3 Control,Vector3 End,float t)
	{
	    return (((1-t)*(1-t)) * Start) + (2 * t * (1 - t) * Control) + ((t * t) * End);
	}
}