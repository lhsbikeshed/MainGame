using UnityEngine;
using System.Collections;

/* if the ships landing gear is down and the ship is in the collider then 
 * attract the ship to the pad
 * if they ship undercarriage pulls up at any time then release the attraction
 * and let the fuckers fly away
 */


public class LandingPad : MonoBehaviour {
	public delegate void DockStateChanged (bool newState);
	Transform theShip;

	public bool shipLanded = false;
	bool applyDockingForce = false;
	public bool hasFuelConnector = false;

	public event DockStateChanged dockStateChanged;


	// Use this for initialization
	void Start () {
		theShip = GameObject.Find ("TheShip").transform;

		if (hasFuelConnector) {
			//register the reactors docking state change method to this landing pad
			Reactor reactor = theShip.GetComponent<Reactor> ();
			GameObject.Find ("LandingSensor").GetComponent<LandingPad> ().dockStateChanged += reactor.dockStateChange;
		}
	}

	void OnDestroy(){
		if (hasFuelConnector) {
			//register the reactors docking state change method to this landing pad
			Reactor reactor = theShip.GetComponent<Reactor> ();
			GameObject.Find ("LandingSensor").GetComponent<LandingPad> ().dockStateChanged -= reactor.dockStateChange;
		}
	}

	void FixedUpdate(){
		if (applyDockingForce) {
			Vector3 padDown = -transform.TransformDirection(Vector3.forward);

			theShip.GetComponent<Rigidbody>().AddForce(padDown * 520f, ForceMode.Force);
		}
	}

	void OnTriggerExit(Collider c){

		if (c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip") {
			shipLanded = false;
			dockStateChanged(false);
			theShip.parent = null;
		}
	}

	void OnTriggerStay(Collider c){
		if (c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip") {
			//test to see if landing gear is down
			if (UndercarriageBehaviour.Instance.state == UndercarriageBehaviour.DOWN) {
				if(!shipLanded){
					dockStateChanged(true);
					shipLanded = true;
					applyDockingForce = true;
					theShip.parent = transform;
				}
			} else {
				applyDockingForce = false;
			}
		}
	}
}
