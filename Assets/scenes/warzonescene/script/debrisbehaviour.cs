using UnityEngine;
using System;

//real life SHIT
[System.Serializable]
public class debrisbehaviour: DynamicFieldObjectBehaviour{
	
	Vector3 randomRotationSpeed;
	public Vector3 startVelocity;
	public float bastardVelocity = 90.0f;
	public bool hitShip = false;
	public float randomSpeed = 50f;

	
	public override void Start() {
		startVelocity = UnityEngine.Random.onUnitSphere * 0.1f;
		randomRotationSpeed = UnityEngine.Random.onUnitSphere * 4.35f; //Quaternion.Euler(Random.value * 0.05, Random.value * 0.05, Random.value * 0.05);
		transform.GetComponent<Rigidbody>().velocity = UnityEngine.Random.onUnitSphere * randomSpeed;
	}
	
	public void OnCollisionEnter(Collision c){
		//if (c.gameObject.name == "TheShip" && hitShip == false){

		//	hitShip = true;
		//}
	
		
	}
	public override void resetTo(Vector3 newpos){
		resetTo(newpos, false);
		
	}
	
	public override void resetTo(Vector3 newpos,bool bastard){
		//srigidbody.isKinematic = true;
		Transform fire = transform.Find("FlameAttachment");
		if(fire != null){
			
			Destroy(fire.gameObject);
		}
		hitShip = false;
		TargettableObject rItem = transform.GetComponent<TargettableObject>();
		transform.position = newpos;
		if(bastard){
				//add a radar script to this 
				
				
				if(rItem == null){
					rItem = gameObject.AddComponent<TargettableObject>();
					GameObject.Find("TheShip").GetComponent<TargettingSystem>().updateTrackingList();
				}
				rItem.objectName = "INCOMING DEBRIS";
				rItem.stateText = " ";
				rItem.colour = new Color(255.0f,0.0f,0.0f);
		
				//randomly aim a piece at the ship
				//transform.rigidbody.velocity = Vector3.Normalize(GameObject.Find("TheShip").transform.position - transform.position) * startVelocity.magnitude * 10.0;
				/*
				 targetPosition + targetDistance * targetDirection * TargetSpeed / projectileSpeed
				 */
				 Transform theShip = GameObject.Find("TheShip").transform;
				 Vector3 tgtPos = GameObject.Find("TheShip").transform.position;
				 float tgtDistance = (tgtPos - transform.position).magnitude;
				 Vector3 leadTarget = tgtPos + tgtDistance * theShip.GetComponent<Rigidbody>().velocity.normalized * theShip.GetComponent<Rigidbody>().velocity.magnitude / (bastardVelocity * 10.0f);
				 // transform.rotation = Quaternion.LookRotation(leadTarget, transform.up);
				 transform.GetComponent<Rigidbody>().velocity = ( leadTarget - transform.position).normalized * (bastardVelocity * 10.0f);
				 UnityEngine.Debug.DrawLine(tgtPos, leadTarget, new Color(255.0f,0.0f,0.0f));
		} else {
			
			if(rItem != null){
				Destroy(rItem);
				GameObject.Find("TheShip").GetComponent<TargettingSystem>().updateTrackingList();

			}
			transform.GetComponent<Rigidbody>().velocity = startVelocity + UnityEngine.Random.onUnitSphere * randomSpeed;
		}
		transform.GetComponent<Rigidbody>().angularVelocity = Vector3.zero;
		
	}
	
	public override void Update() {
	//	transform.Rotate(randomRotationSpeed * Time.deltaTime);
		
	
	}
}
