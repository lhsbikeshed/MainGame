using UnityEngine;
using System.Collections;

public class LightningEffects : MonoBehaviour {

	public float flashRate = 1.0f;
	public float maxFlashDuration = 1.8f;
	public float size = 10f;
	public Vector3 direction = Vector3.zero;

	public float directionBias = 1.0f;
	public float wobbliness = 10f;

	public Transform targetStrike  ;

	private Vector3[] randomPts = new Vector3[10];
	private LineRenderer lineRenderer;
	private float lastPosSwitch = 0f; //last time the bolt flickered;


	bool flashing = false;

	public bool running = true;


	float nextFlashTime = 1.0f;
	float flashDuration = 1.0f;

	// Use this for initialization
	void Start () {
		lineRenderer = GetComponent<LineRenderer>();
		stopEffect();
	}

	public void stopEffect(){

		running = false;
		if(lineRenderer != null){
			lineRenderer.enabled = false;
		}
	}

	public void startEffect(){
		running = true;
		lineRenderer.enabled = true;
	}


	void strikeAtRandom(){
		
		randomPts = new Vector3[10];
		lineRenderer.SetVertexCount(randomPts.Length);
		//calculate a target position based on direction
		
		float targetAngle = (1f - directionBias) * 180f;
		Vector3 pos = Quaternion.Euler( Random.Range(-targetAngle, targetAngle), Random.Range(-targetAngle, targetAngle), 0) * transform.TransformDirection(direction.normalized);


		Vector3 targetPos =  pos * size;
		for( var i = 0; i < 10; i++){
			randomPts[i] = Vector3.Slerp(Vector3.zero, targetPos, i / 10.0f);
			//now move that point outward from the line
			randomPts[i] += Random.onUnitSphere * wobbliness;
			
			lineRenderer.SetPosition(i, randomPts[i]);
		}
		lineRenderer.enabled = true;
		lineRenderer.useWorldSpace = false;
	}

	void OnDrawGizmos(){

		Gizmos.DrawLine(transform.position, transform.position + transform.TransformDirection(direction.normalized) * size);

	}
	
	
	void FixedUpdate () {
			if(running){
			nextFlashTime -= Time.fixedDeltaTime;
			if(nextFlashTime <= 0.0f){
				flashing = true;

				flashDuration = Random.Range (0.1f, maxFlashDuration);
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
							randomPts[i] = Vector3.Slerp(Vector3.zero, targetStrike.position, i / 10.0f);
							if(i < 9){
								randomPts[i] += Random.onUnitSphere * wobbliness;
							}
						} else {
							randomPts[i] += Random.onUnitSphere * wobbliness;
						}
						lineRenderer.SetPosition(i, randomPts[i]);
					}

					lastPosSwitch = Time.fixedTime;	
				}


			}
		}

		
	}

}
