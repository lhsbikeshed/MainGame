using UnityEngine;
using System.Collections;

public class LightningEffects : MonoBehaviour {

	public float flashRate = 1.0f;
	public float size = 10f;
	public Vector3 direction = Vector3.zero;
	public float directionBias = 1.0f;

	public Transform targetStrike  ;

	private Vector3[] randomPts;
	private LineRenderer lineRenderer;
	private float lastPosSwitch = 0f; //last time the bolt flickered;


	bool flashing = false;


	float nextFlashTime = 1.0f;
	float flashDuration = 1.0f;

	// Use this for initialization
	void Start () {
		lineRenderer = GetComponent<LineRenderer>();
	}


	void strikeAtRandom(){
		
		randomPts = new Vector3[10];
		lineRenderer.SetVertexCount(randomPts.Length);
		//calculate a target position based on direction

		float targetAngle = (1f - directionBias) * 360f;
		Vector3 pos = Quaternion.Euler( Random.Range(0, targetAngle), 0, Random.Range(0, targetAngle)) * transform.TransformDirection(direction);


		Vector3 targetPos = transform.position + pos * size;
		for( var i = 0; i < 10; i++){
			randomPts[i] = Vector3.Slerp(transform.position, targetPos, i / 10.0f);
			//now move that point outward from the line
			randomPts[i] += Random.onUnitSphere * (size / 20f);
			
			lineRenderer.SetPosition(i, randomPts[i]);
		}
		lineRenderer.enabled = true;
		
	}

	void OnDrawGizmos(){

		Gizmos.DrawLine(transform.position, transform.position + transform.TransformDirection(direction) * size);
	}
	
	
	void FixedUpdate () {

		nextFlashTime -= Time.fixedDeltaTime;
		if(nextFlashTime <= 0.0f){
			flashing = true;

			flashDuration = Random.Range (0.1f, 1.8f);
			nextFlashTime = flashDuration + Random.Range(0.5f, flashRate);
			strikeAtRandom();
		}

		if(flashing){
			flashDuration -= Time.fixedDeltaTime;
			if(flashDuration <= 0.0f){


				flashing = false;
				lineRenderer.enabled = false;
			}
			if(lastPosSwitch + 0.1f < Time.fixedTime){
				
				for( int i = 0; i < 10; i++){
					if(targetStrike != null){
						randomPts[i] = Vector3.Slerp(transform.position, targetStrike.position, i / 10.0f);
						if(i < 9){
							randomPts[i] += Random.onUnitSphere * (size / 20f);
						}
					} else {
						randomPts[i] += Random.onUnitSphere * (size / 20f);
					}
					lineRenderer.SetPosition(i, randomPts[i]);
				}

				lastPosSwitch = Time.fixedTime;	
			}


		}

		
	}

}
