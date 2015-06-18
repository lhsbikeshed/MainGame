using UnityEngine;
using System.Collections;
using UnityOSC;

/* LANDING PAD
 * something that can be landed on and stuck to. Optional fuel connector
 * 
 * if the ships landing gear is down and the ship is in the collider then 
 * attract the ship to the pad
 * if they ship undercarriage pulls up at any time then release the attraction
 * and let the fuckers fly away
 * 
 * pad may have a fuel connector
 */


public class LandingPad : MonoBehaviour {
	public delegate void DockStateChanged (bool newState);
	Transform theShip;

	public bool shipLanded = false;
	public bool hasGravity = true;
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
		if (applyDockingForce && hasGravity) {
			Vector3 padDown = -transform.TransformDirection(Vector3.forward);

			theShip.GetComponent<Rigidbody>().AddForce(padDown * 520f, ForceMode.Force);
		}
	}
	bool isIgnorable(Collider c){
		if (c.name == "shipDetailBounds") {
			return true;
		}
		
		
		return false;
	}

	void OnTriggerExit(Collider c){
		Debug.Log (" landing pad exit"  + c.name);
		if (c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip" && !isIgnorable(c)) {
			shipLanded = false;
			dockStateChanged(false);
			//theShip.parent = null;

		}
	}


	void OnTriggerStay(Collider c){
		if (c.attachedRigidbody != null && c.attachedRigidbody.name == "TheShip" && !isIgnorable(c)) {
			//test to see if landing gear is down
			if (UndercarriageBehaviour.Instance.state == UndercarriageBehaviour.DOWN) {
				if(!shipLanded){
					if(dockStateChanged != null){
						dockStateChanged(true);
					}
					OSCMessage m = new OSCMessage("/ship/state/docked");
					m.Append(1);
					OSCHandler.Instance.SendMessageToAll(m);
					shipLanded = true;
					applyDockingForce = true;
					//theShip.parent = transform;
				}
			} else {
				applyDockingForce = false;
				if(shipLanded){
					shipLanded = false;
					OSCMessage m = new OSCMessage("/ship/state/docked");
					m.Append(0);
					OSCHandler.Instance.SendMessageToAll(m);
				}
			}
		}
	}
}
