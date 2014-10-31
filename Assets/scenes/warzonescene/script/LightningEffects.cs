using UnityEngine;
using System.Collections;

public class LightningEffects : MonoBehaviour {

	public float flashRate = 1.0f;
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
		
		Vector3 targetPos = transform.position + Random.onUnitSphere * 2500.0f;
		for( var i = 0; i < 10; i++){
			randomPts[i] = Vector3.Slerp(transform.position, targetPos, i / 10.0f);
			//now move that point outward from the line
			randomPts[i] += Random.onUnitSphere * 150.0f;;
			
			lineRenderer.SetPosition(i, randomPts[i]);
		}
		lineRenderer.enabled = true;
		
	}
	
	
	void FixedUpdate () {

		nextFlashTime -= Time.fixedDeltaTime;
		if(nextFlashTime <= 0.0f){
			flashing = true;

			flashDuration = Random.Range (0.1f, 1.8f);
			nextFlashTime = flashDuration + Random.Range(1.0f, 3.0f);
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
							randomPts[i] += Random.onUnitSphere * 150.0f;;
						}
					} else {
						randomPts[i] += Random.onUnitSphere * 150.0f;;
					}
					lineRenderer.SetPosition(i, randomPts[i]);
				}

				lastPosSwitch = Time.fixedTime;	
			}


		}

		
	}

}
