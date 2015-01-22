using UnityEngine;
using System;


public class TunnelEntranceBehaviour:MonoBehaviour{
	
	/*
	*/
	
	public bool entering = false;
	public bool inTunnel = false;
	
	Transform theShip;
	Transform skyboxCamera;
	
	public TunnelController tunnel;
	
	float lightLevel = 1.0f;
	Color previousAmbient;
	Light directionalLight;
	float previousDirectional;
	
	public ParticleSystem[] disableList;
	
	public void Start() {
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("skyboxCamera").transform;
		directionalLight = GameObject.Find("Directional light").GetComponent<Light>();
		
	
	}
	
	public void tunnelEntered(){
		if(entering == false){
			entering = true;
			
			previousAmbient = RenderSettings.ambientLight;
			previousDirectional = directionalLight.intensity;
			foreach(ParticleSystem p in disableList){
				p.enableEmission = false;
			}
		}
		
	}
	
	public void FixedUpdate() {
		if(entering){
			if(lightLevel >= 0.0f){
				lightLevel -= 0.001f;
				
				//begin darkening the world
				RenderSettings.ambientLight = previousAmbient * lightLevel;
				directionalLight.intensity = previousDirectional * lightLevel;
				
			} else {
				if(!inTunnel){
					entering = false;
					theShip.parent = null;
					tunnel.positionShipAtStart();
					inTunnel = true;
					GameObject.Find("SceneScripts").GetComponent<CometTunnelScene>().enteredTunnel();
				}
			}
		}
	
	}
	
	public void OnTriggerEnter(Collider col){
		if(col.name == "TheShip" && entering == false){
			UnityEngine.Debug.Log("Entered tunnel");
			tunnelEntered();
		}
	}

}
