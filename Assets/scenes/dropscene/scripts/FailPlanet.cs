using UnityEngine;
using System;


public class FailPlanet:MonoBehaviour{
	
	public Transform theShip;
	public Transform lightPos;
	
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		if (lightPos == null){
			lightPos = GameObject.Find("Directional light").transform;
		}
	}
	
	public void Update() {
		renderer.material.SetVector("_ViewPos", (Vector4)theShip.position);
		renderer.material.SetVector("_SunPos", (Vector4)lightPos.position);
	
		
	}

}