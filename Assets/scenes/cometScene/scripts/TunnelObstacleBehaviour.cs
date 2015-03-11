using UnityEngine;
using System;
using System.Collections.Generic;
using System.Collections;

[System.Serializable]
public class TunnelObstacleBehaviour: GeneralTrackableTarget {

	public List<Transform> childParts;

	public bool trashed = false;
	public float trashedTimer = 0f;

	public override void Start() {
		base.Start();
	}

	public void FixedUpdate() {
		if(trashed){
			trashedTimer += Time.fixedDeltaTime;
			if(trashedTimer > 4.0f){
				Destroy(gameObject);
			}
		}

	}

	public override IEnumerator explode(){
		if(! exploding){
			exploding = true;
			doExplosion(transform.position);
		}
			yield return new WaitForSeconds(0);
	}

	public void doExplosion(Vector3 source){
		trashed = true;
		foreach(Transform t in childParts){
			t.GetComponent<Rigidbody>().constraints = RigidbodyConstraints.None;
			t.GetComponent<Rigidbody>().AddExplosionForce(9000f, source, 700f);
			
		}
	}

	public void OnCollisionEnter(Collision col){
//		Debug.Log(col.gameObject.name);
		
		if(col.gameObject.name == "TheShip" && trashed == false){
			doExplosion(col.gameObject.GetComponent<Rigidbody>().transform.position);
		}

	}
}
