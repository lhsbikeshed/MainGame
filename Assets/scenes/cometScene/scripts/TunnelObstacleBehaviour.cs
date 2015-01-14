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
			t.rigidbody.constraints = RigidbodyConstraints.None;
			t.rigidbody.AddExplosionForce(5000f, source, 500f);
			
		}
	}

	public void OnTriggerEnter(Collider col){
//		Debug.Log(col.gameObject.name);
		
		if(col.gameObject.name == "TheShip"){
			doExplosion(col.rigidbody.transform.position);
		}

	}
}
