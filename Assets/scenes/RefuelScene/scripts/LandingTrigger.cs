using UnityEngine;
using System.Collections;

public class LandingTrigger : MonoBehaviour {

	public bool inTrigger = false;

	Vector3 basePos = Vector3.zero;
	Vector3 localShipPos = Vector3.zero;
	Bounds b = new Bounds();

	// Use this for initialization
	void Start () {
		b = GetComponent<BoxCollider>().bounds;
		basePos = transform.position;

	}
	
	// Update is called once per frame
	void Update () {
	
	}

	void OnTriggerStay(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip"){
			inTrigger = true;

			localShipPos = transform.InverseTransformPoint(c.transform.position);

		}

	}

	void OnTriggerEnter(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip"){
			inTrigger = true;
		}

	}

	void OnTriggerExit(Collider c){
		if(c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip"){
			inTrigger = false;
		}
		

	}

	void OnDestroy(){
		if(inTrigger){
			//revert the top level screen
		}
	}

	void OnDrawGizmos(){
		Gizmos.DrawWireCube(b.center, b.extents);
		Gizmos.DrawRay(new Ray(b.center, Vector3.forward*10));
		Gizmos.DrawSphere(basePos + localShipPos, 2);
	}
}
