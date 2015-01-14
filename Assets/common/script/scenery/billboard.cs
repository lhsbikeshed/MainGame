using UnityEngine;
using System;


public class billboard:MonoBehaviour{
	 public Transform target;
	
	public void Start() {
		if(target == null){
			target = GameObject.Find("TheShip").transform;
		}
	}
	
	public void Update() {
		transform.LookAt(target);
	}
}