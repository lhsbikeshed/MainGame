using UnityEngine;
using System;


public class CameraPoint:MonoBehaviour{
	
	public bool followShip = true;
	public bool zoomOnEnter = false;
	public float startFov = 60.0f;
	public float endFov = 15.0f;
	public float fovChangeTime = 2.0f;
	
	public bool onLeaveReset = true;
	public bool triggerCabinCam = false;
	public float cabinCamDuration = 10.0f;
	public bool disableRandomCabinCamEnter = false;
	public bool disableRandomCabinCamLeave = false;
	
	
	float fovChangeStart;
	DynamicCamera cam;
	bool startZoom = false;
	
	public void Start() {
		//gameObject.tag = "CameraPoint";
		GameObject d = GameObject.Find("DynamicCamera");
		if(d != null){
			cam = d.GetComponent<DynamicCamera>();
		}
		//Debug.Log("Piss: " + GameObject.Find("DynamicCamera"));
	}
	
	public void Update() {
	
	}
	
	public void FixedUpdate(){
		if(zoomOnEnter && startZoom){
			cam.GetComponent<Camera>().fieldOfView = Mathf.Clamp( Mathf.Lerp(startFov, endFov, (Time.fixedTime - fovChangeStart) / fovChangeTime), startFov,endFov);
		}
	}
	
	
	public void OnTriggerEnter(Collider col){
		//Debug.Log(col.transform.name);
		if(col.gameObject.name == "TheShip"){
			if(cam == null){
				GameObject d = GameObject.Find("DynamicCamera");
				if(d!= null){
					cam = d.GetComponent<DynamicCamera>();
				}
			}
			if(cam!= null){
				UnityEngine.Debug.Log("Switching to camera: " + transform.name);
				cam.setLocation(transform);
				cam.lookAtShip = followShip;
				cam.canCabinCamBeUsed = !disableRandomCabinCamEnter;
				if(triggerCabinCam){
					cam.showCabinCamera(0, cabinCamDuration);
				} else {
					cam.hideCabinCamera();
				}
				if(!followShip){
					cam.transform.rotation = transform.rotation;
				}
				cam.GetComponent<Camera>().fieldOfView = startFov;
				fovChangeStart = Time.fixedTime;
				startZoom = true;
			}
			
		}
	}
	public void OnTriggerExit(Collider col){
		if(col.gameObject.name == "TheShip" && onLeaveReset){
			if(cam != null){
				cam.resetToShip();
				cam.canCabinCamBeUsed = !disableRandomCabinCamLeave;
				startZoom = false;
			}
		}
	}
}
