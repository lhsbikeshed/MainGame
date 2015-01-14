using UnityEngine;
using System;
using System.Collections.Generic;


public class BezierTrack:MonoBehaviour{
	
	public List<Vector3> controlPoints;
	public List<Vector3> detailCpList;
	
	public float divisions;
	
	public Transform mover;
	public float moveTime = 0.0f;
	
	public bool running = false;
	public float startIndex = 0.0f;
	public float moveSpeed = 1f;
	
	
	Vector3 lastUp;
	
	public void Start() {
	
		mover = transform.Find("mover");
	//	mover.position = startPos;
		controlPoints = generateDetailList();
	}
	
	public void FixedUpdate() {
		if(running){
			
			moveTime += moveSpeed / 100f;
			// work out which section of 3 points the movetime is currently in
			//0-1 > 0,1,2,3
			//1-2 > 3,4,5,6
			//2-3 > 6,7,8,9
			//3-4 > 9,10,11,12
			//4-5 > 12,13,14,15
			startIndex = (float)(Mathf.FloorToInt(moveTime) * 3);
			if(startIndex + 3 > controlPoints.Count){
				moveTime = 0.0f;
			} else {
			float moveTimeTrimmed = moveTime % 1.0f;;
				mover.position = Bezier(controlPoints[(int)startIndex], controlPoints[(int)(startIndex + 1)], controlPoints[(int)(startIndex + 2)],  controlPoints[(int)(startIndex + 3)], moveTimeTrimmed);
				Quaternion targetRot = Quaternion.LookRotation(curveTangent(controlPoints[(int)startIndex], controlPoints[(int)(startIndex + 1)], controlPoints[(int)(startIndex + 2)],  controlPoints[(int)(startIndex + 3)], moveTimeTrimmed), lastUp);
				mover.rotation = Quaternion.Slerp(mover.rotation, targetRot, 0.5f);
				lastUp = mover.up;
			}
		}
	
	}
	
	public List<Vector3> generateDetailList() {
	
		List<Vector3> ret = new System.Collections.Generic.List<Vector3>(controlPoints);
		
		for(int i = controlPoints.Count - 1; i >= 1; i--){
			Vector3 midP = (controlPoints[i] + controlPoints[i-1] ) / 2.0f;
			ret.Insert(i, midP);
		}
		return ret;
	}
	
	
	public void OnDrawGizmos(){
		detailCpList = controlPoints;
	
		for(int i = 0; i < controlPoints.Count - 3; i+=3){
			//Debug.Log(i + " - " + detailCpList.Count);
			Vector3 cp = detailCpList[i];
			Vector3 cpControl = detailCpList[i + 1];
			Vector3 cpControl2 = detailCpList[i + 2];
			Vector3 cpEnd = detailCpList[i + 3];
			
			
			Gizmos.color = new Color(0.0f,1.0f,0.0f);
			Gizmos.DrawSphere(cp, 5.0f);
			Gizmos.color = new Color(1.0f,1.0f,0.0f);
			Gizmos.DrawSphere(cpControl, 5.0f);
			Gizmos.DrawSphere(cpControl2, 5.0f);
			Gizmos.color = new Color(1.0f,0.0f,0.0f);
			Gizmos.DrawLine(cp, cpControl);
			Gizmos.DrawLine(cpEnd, cpControl2);
			
			float acc = 0.0f;
			float step =  1.0f / divisions;
			Vector3 prevPos = cp;
			for(int p = 0; p < divisions; p++){
				Vector3 pos = Bezier(cp, cpControl, cpControl2, cpEnd, acc);
				
				Gizmos.color = new Color(1.0f,1.0f,0.0f);
				Gizmos.DrawLine(prevPos, pos);
				prevPos = pos;
				acc += step;
			}
			Gizmos.DrawLine(prevPos, cpEnd);
			
		}
	
		
		
	}
	
	public Vector3 curveTangent(Vector3 Start,
                                Vector3 Control,
                                Vector3 Control2,
                                Vector3 End,
                                float t) {
		//return 2 * (1-t) * (Control - Start) + 2 * t * (End - Control);
		return (3 * Mathf.Pow(1-t, 2.0f) * (Control - Start)) + ( 6*(1-t)*t *(Control2 - Control)) + (3 * t * t * (End - Control2));
		
	}
	
	//shamelessly stolen from unity forums..
	public Vector3 Bezier(Vector3 Start,Vector3 Control,Vector3 Control2,Vector3 End,float t)
	{
	    //return (((1-t)*(1-t)) * Start) + (2 * t * (1 - t) * Control) + ((t * t) * End);
	    return (Mathf.Pow(1-t, 3.0f) * Start) + (3 * Mathf.Pow(1-t, 2.0f) * t * Control) + (3*(1-t)*t*t*Control2 + (Mathf.Pow(t, 3.0f) * End));
	    
	}


}