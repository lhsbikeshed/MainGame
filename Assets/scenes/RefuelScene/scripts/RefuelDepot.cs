using UnityEngine;
using System.Collections;

/* wait to get shot at
 * explode
 * weeeeeeeeeee! */
public class RefuelDepot : MonoBehaviour {

	public bool test = false;
	public Transform[] explodingParts;

	public Transform explosionBoxPrefab;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
		if (test) {
			startExploding();
			test = false;
		}
	}

	IEnumerator doExplosion(){
		Vector3 centrePoint = transform.position;
		foreach (Transform t in explodingParts) {
			GameObject g = new GameObject();
			g.transform.position = t.position;
			g.transform.rotation = t.rotation;

			t.parent = g.transform;
			//add a rigidbody to all exploding components
			Rigidbody r = g.AddComponent<Rigidbody>();
			r.useGravity = false;
			r.mass = 500;
			//kick them apart a little
			r.AddExplosionForce(150, g.transform.position + Random.onUnitSphere * 10, 800);
			r.AddRelativeTorque(Random.onUnitSphere * 500, ForceMode.Impulse);

			//add an explosion particle emitter
			if(t.GetComponent<Renderer>() != null){
				Transform exp = Instantiate<Transform>(explosionBoxPrefab);
				exp.transform.localScale = t.GetComponent<Renderer>().bounds.size * 1.25f;
				exp.transform.parent = g.transform;
				exp.transform.localPosition = Vector3.zero;
				exp.transform.localRotation = Quaternion.Euler(90,0,0);
			}

		}

		yield return new WaitForSeconds (1);

	}

	public void startExploding(){
		StartCoroutine (doExplosion ());
	}
}
