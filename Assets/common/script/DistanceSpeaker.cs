using UnityEngine;
using System;
using System.Collections;



public class DistanceSpeaker:MonoBehaviour{
	
	
	/* speak a distance using attached sounds */
	Transform theShip;
	public AudioClip[] sounds;
	bool speaking = false;
	
	public static DistanceSpeaker _instance;
	
	
	public void Start() {
		_instance = this;
	
	}
	
	
	public static DistanceSpeaker Instance() {
		
		return _instance;
	}
	
	
	public void Update() {
	
	}
	
	public IEnumerator DistancePart(int clip,int fig){
		AudioSource.PlayClipAtPoint(sounds[clip], transform.position);
		yield return new WaitForSeconds(sounds[clip].length);
		if(fig == 1000){
			//Debug.Log(clip + "thousand");
			AudioSource.PlayClipAtPoint(sounds[11], transform.position);
			yield return new WaitForSeconds(sounds[11].length);
		} else if (fig == 100){
			//Debug.Log(clip + "hundred");
			
			AudioSource.PlayClipAtPoint(sounds[10], transform.position);
			yield return new WaitForSeconds(sounds[10].length);
			
		}
		
	}
	
	
	public void SpeakDistance(float distance,int figures){
		StartCoroutine(SpeakDistance(distance, figures, true));
	}
	
	public IEnumerator SpeakDistance(float distance,int figures,bool metersSuffix){
	
		//figures == 1000 or 100
		int toSpeak = 0;
		if(figures == 1000){
			toSpeak = Mathf.FloorToInt(distance / 1000.0f);
			if(toSpeak < 0 || toSpeak > 10){
				yield return null;
			}
			if(!speaking){
				speaking = true;
				yield return StartCoroutine(DistancePart(toSpeak, 1000));
				//metres
				if(metersSuffix){
					AudioSource.PlayClipAtPoint(sounds[12], transform.position);
					yield return new WaitForSeconds(sounds[12].length);
				}
				speaking = false;
			}
		} else if (figures == 100){
			int thousands = Mathf.FloorToInt(distance / 1000.0f);
			toSpeak = thousands;
			if(toSpeak < 0 || toSpeak > 10){
				yield return null;
			}
			if(!speaking){
				speaking = true;
				if(toSpeak > 0){
					yield return StartCoroutine(DistancePart(toSpeak, 1000));
				}
				float hundreds = distance - thousands * 1000;
				toSpeak = Mathf.FloorToInt(hundreds / 100.0f);
				
				if(toSpeak < 0 || toSpeak > 10){
					yield return null;
				}
				if(toSpeak > 0){
					yield return StartCoroutine(DistancePart(toSpeak, 100));
				}
				
				//metres
				if(metersSuffix){
					AudioSource.PlayClipAtPoint(sounds[12], transform.position);
					yield return new WaitForSeconds(sounds[12].length);
				}
				speaking = false;
			}
		} else if (figures == 10){
		} else if (figures == 1){
			speaking = true;
			int s = Mathf.FloorToInt(distance);
			AudioSource.PlayClipAtPoint(sounds[s], transform.position);
			yield return new WaitForSeconds(sounds[s].length);
			if(metersSuffix){
				AudioSource.PlayClipAtPoint(sounds[12], transform.position);
				yield return new WaitForSeconds(sounds[12].length);
			}
			speaking = false;
		}
		
		
	}
}