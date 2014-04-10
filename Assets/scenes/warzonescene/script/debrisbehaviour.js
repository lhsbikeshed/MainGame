#pragma strict



//real life SHIT
public class debrisbehaviour extends DynamicFieldObjectBehaviour{
	
	private var randomRotationSpeed: Quaternion;
	var startVelocity : Vector3;
	var bastardVelocity : float = 90.0f;
	var hitShip : boolean = false;

	
	function Start () {
		startVelocity = Random.onUnitSphere * 0.1f;
		randomRotationSpeed = Quaternion.Euler(Random.value * 0.05, Random.value * 0.05, Random.value * 0.05);
		transform.rigidbody.velocity = startVelocity;
	}
	
	function OnCollisionEnter(c : Collision){
		//if (c.gameObject.name == "TheShip" && hitShip == false){

		//	hitShip = true;
		//}
	
		
	}
	function resetTo( newpos : Vector3){
		resetTo(newpos, false);
		
	}
	
	function resetTo(newpos : Vector3, bastard : boolean){
		//srigidbody.isKinematic = true;
		
		hitShip = false;
		var rItem : TargettableObject = transform.GetComponent.<TargettableObject>();
		transform.position = newpos;
		if(bastard){
				//add a radar script to this 
				
				
				if(rItem == null){
					rItem = gameObject.AddComponent.<TargettableObject>();
					GameObject.Find("TheShip").GetComponent.<TargettingSystem>().updateTrackingList();
				}
				rItem.objectName = "INCOMING DEBRIS";
				rItem.stateText = " ";
				rItem.colour = Color(255,0,0);
		
				//randomly aim a piece at the ship
				//transform.rigidbody.velocity = Vector3.Normalize(GameObject.Find("TheShip").transform.position - transform.position) * startVelocity.magnitude * 10.0;
				/*
				 targetPosition + targetDistance * targetDirection * TargetSpeed / projectileSpeed
				 */
				 var theShip : Transform = GameObject.Find("TheShip").transform;
				 var tgtPos : Vector3 = GameObject.Find("TheShip").transform.position;
				 var tgtDistance : float = (tgtPos - transform.position).magnitude;
				 var leadTarget : Vector3 = tgtPos + tgtDistance * theShip.rigidbody.velocity.normalized * theShip.rigidbody.velocity.magnitude / (bastardVelocity * 10.0f);
				 // transform.rotation = Quaternion.LookRotation(leadTarget, transform.up);
				 transform.rigidbody.velocity = ( leadTarget - transform.position).normalized * (bastardVelocity * 10.0f);
				 Debug.DrawLine(tgtPos, leadTarget, Color(255,0,0));
		} else {
			
			if(rItem != null){
				Destroy(rItem);
				GameObject.Find("TheShip").GetComponent.<TargettingSystem>().updateTrackingList();

			}
			transform.rigidbody.velocity = startVelocity;
		}
		transform.rigidbody.angularVelocity = Vector3.zero;
		
	}
	
	function Update () {
		transform.rotation *= randomRotationSpeed;
		
	
	}
}