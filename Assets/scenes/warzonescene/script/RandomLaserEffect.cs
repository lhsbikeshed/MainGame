using UnityEngine;
using System.Collections;

public class RandomLaserEffect : MonoBehaviour {

	public int numberOfLasers = 5;
	public Transform laserPrefab;
	public Transform laserTarget;
	public float radius = 20.0f;

	LineRenderer[] laserLines;
	float[] laserTimes;


	// Use this for initialization
	void Start () {
		//clone the linerenderer attached to us as a template
		laserTimes = new float[numberOfLasers];
		laserLines = new LineRenderer[numberOfLasers];

		for(int i = 0; i < numberOfLasers; i++){
			Transform t  = (Transform)Instantiate(laserPrefab, Vector3.zero, Quaternion.identity);
			laserLines[i] = t.GetComponent<LineRenderer>();

			laserLines[i].transform.parent = transform;
			laserTimes[i] =  Random.Range(0,3);
			newTarget(i);
		}
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		for(int i = 0; i < numberOfLasers; i++){
			laserTimes[i] -= Time.fixedDeltaTime;
			if(laserTimes[i] <= 0.0f){
				//toggle laser
				if(laserLines[i].enabled == true){
					laserLines[i].enabled = false;
					laserTimes[i] = Random.Range(1.0f, 3.0f);
				} else {
					//set a new target
					newTarget(i);
					laserLines[i].enabled = true;
					laserTimes[i] = Random.Range(2.0f, 5.0f);
				}

			}

		}
	
	}
	void newTarget(int i){
		Vector3 pos = transform.position + Random.onUnitSphere * radius;
		laserLines[i].SetPosition(0, pos);
		pos = laserTarget.position + Random.onUnitSphere * radius;
		laserLines[i].SetPosition(1, pos);
	}
}
