using UnityEngine;
using System.Collections;

public class FormationTarget : MonoBehaviour {

	public Transform theShip;
	public Transform npcShip;

	public Vector3 distance;

	public float distFromSource = 40f;
	public float radius = 10f;


	// Use this for initialization
	void Start () {
		if(theShip == null){
			theShip = GameObject.Find ("TheShip").transform;
		}
		if(npcShip == null){
			npcShip = GameObject.Find ("npcvan").transform;
		}
	}
	
	void FixedUpdate () {

	
		//proj offset between us and target onto a plane


		Vector3 sourcePos = theShip.position + theShip.TransformDirection(distance);

		//plane is now in our local xy plane
		//project npc van onto this plane
		Vector3 shipOffset = npcShip.position - sourcePos;
		Vector3 planeNormal = (sourcePos - theShip.position).normalized;

		Vector3 shipPlanePos = Vector3.Project(shipOffset, planeNormal);

		shipPlanePos.Normalize();
		shipPlanePos *= radius;
		//shipPlanePos += transform.position;
		transform.position = sourcePos + shipPlanePos;


				
	}

	void OnDrawGizmos(){
		Gizmos.color = new Color(1.0f,0.0f,0.0f);
		Gizmos.DrawWireSphere(transform.position, 4);

	}
}
