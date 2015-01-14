using UnityEngine;
using System;


public class HyperspaceStream:MonoBehaviour{
	
	public Vector3 rotAmt;
	
	Quaternion orgRot;
	
	
	public void Start() {
		orgRot = transform.rotation;
	}
	
	public void Update() {
		float xAng = Mathf.Sin(Time.fixedTime) / rotAmt.x;
		float yAng = Mathf.Cos(Time.fixedTime) / rotAmt.y;
		transform.rotation = orgRot * Quaternion.EulerAngles(xAng,yAng,0.0f);
		
	
	}
}