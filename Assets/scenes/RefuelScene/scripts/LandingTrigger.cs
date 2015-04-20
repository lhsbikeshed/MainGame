using UnityEngine;
using System.Collections;
using UnityOSC;

public class LandingTrigger : MonoBehaviour {

	public bool inTrigger = false;
	public float clientScaleFactor = 1.0f;

	Vector3 basePos = Vector3.zero;
	Vector3 localShipPos = Vector3.zero;
	Quaternion localShipRot = Quaternion.identity;
	Bounds b = new Bounds();

	float lastUpdateTime = 0;


	Transform theShip;

	// Use this for initialization
	void Start () {
		b = GetComponent<BoxCollider>().bounds;
		basePos = transform.position;
		theShip = GameObject.Find ("TheShip").transform;
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		if (Time.fixedTime - lastUpdateTime > 0.250f) {
			lastUpdateTime = Time.fixedTime;
			OSCMessage m = new OSCMessage("/screen/landingDisplay/shipTransform");
			m.Append(localShipPos.x * clientScaleFactor);
			m.Append(localShipPos.y * clientScaleFactor);
			m.Append(localShipPos.z * clientScaleFactor);
			m.Append(localShipRot.w);
			m.Append(localShipRot.x);
			m.Append(localShipRot.y);
			m.Append(localShipRot.z);
			OSCHandler.Instance.SendMessageToClient("PilotStation", m);

		}
	}

	bool isIgnorable(Collider c){
		if (c.name == "shipDetailBounds") {
			return true;
		}

		return false;
	}

	void OnTriggerStay(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip" && !isIgnorable(c)){
			inTrigger = true;

			localShipPos = theShip.localPosition;
			localShipRot = Quaternion.Inverse(theShip.rotation)* transform.rotation;
		}

	}

	void OnTriggerEnter(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip" && !isIgnorable(c)){
			inTrigger = true;
			OSCHandler.Instance.ChangeClientScreen("PilotStation", "landingDisplay", true);
			theShip.parent = transform;
		}

	}

	void OnTriggerExit(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip" && !isIgnorable(c)){
			inTrigger = false;
			OSCHandler.Instance.RevertClientScreen("PilotStation", "landingDisplay");
			theShip.parent = null;
		}
		

	}

	void OnDestroy(){
		if(inTrigger){
			//revert the top level screen
		}
	}

	void OnDrawGizmos(){

	}
}
