using UnityEngine;
using System;
using UnityOSC;


public class DynamicCamera:MonoBehaviour{
	
	public Transform theShip;
	
	public Transform currentLocation;
	public bool lookAtShip;
	public bool followingShip;
	public bool useWebcam = false;
	
	public float lerpSpeed = 0.1f;
	
	
	Camera skyboxCamera;
	bool useSkyboxCamera=  false;
	Transform depthSkyboxObject;
	
	
	MapController mapController;
	 public Transform followTransform;
	
	
	public float distance = 10.0f;
	// the height we want the camera to be above the target
	public float height = 5.0f;
	// How much we 
	public float heightDamping = 2.0f;
	public float rotationDamping = 3.0f;
	
	
	
	 
	  /* cabin camera controls*/
	public bool canCabinCamBeUsed = false; 
	float lastCabinShow = 0.0f;
	float camDuration = 10.0f;
	float camStart = 0.0f;
	bool camVisible = false;
	
	public void Awake() {
		DontDestroyOnLoad(this);
		if (OSCHandler.Instance.configItems["useChaseCam"] != "true"){
			Destroy (gameObject);
		} else {
			init();
		}
		
	}
	
	public void OnLevelWasLoaded(int scene){
		useSkyboxCamera = false;
		if (OSCHandler.Instance.configItems["useChaseCam"] == "true"){
			init();	
		}
		canCabinCamBeUsed = true;
	
	}
	
	/* reconfigure cameras for current scene
	*/
	public void init(){
		GameObject ts = GameObject.Find("TheShip");
		if(ts != null){
			theShip = ts.transform;
		}
		hideCabinCamera();
		
		//find out if this scene uses a skybox camera. If it does then attach a camera to it 
		//with same parameters as ours but depth -1
		//also alter current camera to cleartodepth
		
		
	
		GenericScene g = GameObject.Find("SceneScripts").GetComponent<GenericScene>();
		if(g.skyboxCameraActive == true){
		
			useSkyboxCamera = true;
			//find current skyboxcam
			GameObject sourceSkyboxObject = GameObject.Find("skyboxCamera");
			//create a new camera object for the depth bits
			GameObject sbNew = new GameObject();			
			sbNew.AddComponent<Camera>();
			sbNew.name = "ChaseCamSkybox";
			//sbNew.transform.parent = sbObject.transform;
			sbNew.transform.localPosition = Vector3.zero;
			sbNew.transform.localRotation = Quaternion.identity;
			sbNew.layer = 9;
			skyboxCamera = sbNew.GetComponent<Camera>();
			skyboxCamera.cullingMask = 1 << LayerMask.NameToLayer("skybox") ;
			skyboxCamera.fieldOfView = GetComponent<Camera>().fieldOfView;
			skyboxCamera.depth = GetComponent<Camera>().depth;
			skyboxCamera.farClipPlane = 5500.0f;
			GetComponent<Camera>().depth += 1.0f;
			GetComponent<Camera>().clearFlags = CameraClearFlags.Depth;
			GetComponent<Camera>().cullingMask = GetComponent<Camera>().cullingMask & ~(1 << LayerMask.NameToLayer("skybox"));
			skyboxCamera.rect = GetComponent<Camera>().rect;
			skyboxCamera.clearFlags = CameraClearFlags.Skybox;
			depthSkyboxObject = sbNew.transform;
			//remember ref for mapcontroller for camera scaling
			mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();
			
			var tmp_cs1 = skyboxCamera.rect;
            tmp_cs1.width = 0.5f;
            tmp_cs1.x = 0.5f;
            tmp_cs1.height = 1.0f;
            skyboxCamera.rect = tmp_cs1;
			var tmp_cs2 = sourceSkyboxObject.GetComponent<Camera>().rect;
            tmp_cs2.width = 0.5f;
            tmp_cs2.x = 0.0f;
            sourceSkyboxObject.GetComponent<Camera>().rect = tmp_cs2;
			
			var tmp_cs3 = GetComponent<Camera>().rect;
            tmp_cs3.x = 0.5f;
            tmp_cs3.width = 0.5f;
            tmp_cs3.height = 1.0f;
            GetComponent<Camera>().rect = tmp_cs3;
			if(theShip != null){
				resetToShip();
			}
		} else {
			GetComponent<Camera>().clearFlags = CameraClearFlags.Skybox;
			GetComponent<Camera>().depth = -1.0f;
		}
	
			
	
	
	
		//setup the webcam plane	
		if(OSCHandler.Instance.configItems["useWebcam"] == "true"){
			useWebcam = true;
		
		
			
		} else {
			
		}
		//move to ship if were not currently stuck to a camereapoint
		if(followTransform  == null){
			resetToShip();
		}
	}
	
	public void setLocation(Transform t){
	//	transform.parent = t;
	//	transform.localPosition = Vector3.zero;
		followTransform = t;
		followingShip = false;
		hideCabinCamera();
	}
	
	public void resetToShip(){
		if (OSCHandler.Instance.configItems["useChaseCam"] == "false"){
			return;
		}
		if(transform.parent != null){
			transform.parent = null;
		}
		
		followingShip = true;
		transform.position = GameObject.Find("DefaultDynamicCamera").transform.position;
		followTransform = GameObject.Find("DefaultDynamicCamera").transform;
		transform.localPosition = Vector3.zero;
		transform.localRotation = Quaternion.identity;
		transform.LookAt(theShip);
		GetComponent<Camera>().fieldOfView = 60.0f;
		lookAtShip = true;
		canCabinCamBeUsed = true;
	}
	
	public void Update(){
		if(useSkyboxCamera){
			depthSkyboxObject.rotation = transform.rotation;
			Vector3 basePos = new Vector3((float)mapController.sectorPos[0], (float)mapController.sectorPos[1], (float)mapController.sectorPos[2]) * mapController.cellSize;
		
			depthSkyboxObject.position = (basePos + transform.position) * 0.01f;
		
		}
		if(followingShip){
			
		} else {
			if(followTransform != null){
				transform.position = followTransform.position;
				if(lookAtShip){
					transform.LookAt(theShip, followTransform.TransformDirection(Vector3.up));
					transform.position = followTransform.position;
					
					
				} else {
					transform.rotation = followTransform.rotation;
				}
			}
		}
		
	}
	
	/* tell cam system to show the camera stream */
	public void showCabinCamera(int camNum,float duration){
		if(canCabinCamBeUsed){
			OSCMessage msg = new OSCMessage("/system/webcam/show");
			OSCHandler.Instance.SendMessageToAll(msg);
			camVisible = true;
			camStart = Time.fixedTime;
			camDuration = duration;
		}
	}
	
	public void hideCabinCamera(){
		OSCMessage msg = new OSCMessage("/system/webcam/hide");
		OSCHandler.Instance.SendMessageToAll(msg);
		camVisible = false;
	}
	
	public void FixedUpdate() {
		
		if(canCabinCamBeUsed){
			if(lastCabinShow + 10.0f < Time.fixedTime){
				if(camVisible){
					hideCabinCamera();
				} else {
					showCabinCamera(0, 10.0f);
				}
				lastCabinShow = Time.fixedTime;
			}
		}
		
		if(camVisible){
			if(camStart + camDuration < Time.fixedTime){
				hideCabinCamera();
			}
		}
		if(followingShip){
			if(followTransform != null){
			//	transform.position = Vector3.Lerp(transform.position, followTransform.position, lerpSpeed * Time.deltaTime);
				//transform.position = followTransform.position;
			//	transform.LookAt(theShip, followTransform.TransformDirection(Vector3.up));
				CamUpdate();
			}
		}
		
		
		
	}
	
	
	
	public void CamUpdate() {
		// Early out if we don't have a target
		if (followTransform == null)
			return;
		
		// Calculate the current rotation angles
		float wantedRotationAngle = followTransform.eulerAngles.y;
		float wantedHeight = followTransform.position.y + height;
			
		float currentRotationAngle = transform.eulerAngles.y;
		float currentHeight = transform.position.y;
		
		// Damp the rotation around the y-axis
		currentRotationAngle = Mathf.LerpAngle (currentRotationAngle, wantedRotationAngle, rotationDamping * Time.deltaTime);
	
		// Damp the height
		currentHeight = Mathf.Lerp (currentHeight, wantedHeight, heightDamping * Time.deltaTime);
	
		// Convert the angle into a rotation
		Quaternion currentRotation = Quaternion.Euler (0.0f, currentRotationAngle, 0.0f);
		
		// Set the position of the camera on the x-z plane to:
		// distance meters behind the target
		transform.position = followTransform.position;
		transform.position -= currentRotation * Vector3.forward * distance;
	
		// Set the height of the camera
		var tmp_cs4 = transform.position;
        tmp_cs4.y = currentHeight;
        transform.position = tmp_cs4;
		
		// Always look at the target
		transform.LookAt (followTransform);
	}
}

