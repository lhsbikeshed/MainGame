using UnityEngine;
using System;

public class ATCSound:MonoBehaviour{
	
	
	public AudioSource source;
	public object[] clips;
	
	float postDelay = 1.0f;
	float lastPlay = 1.0f;
	
	public bool running = false;
	
	Reactor shipReactor;
	
	public void Start() {
		clips = Resources.LoadAll("atc", typeof(AudioClip));
		UnityEngine.Debug.Log("loaded " + clips.Length + " atc clips");
		source = gameObject.AddComponent<AudioSource>();
		source.volume = 0.26f;
		
		shipReactor = GameObject.Find("TheShip").GetComponent<Reactor>();
	}
	
	
	public void FixedUpdate() {
		running = shipReactor.systemEnabled;
		
		if(source.isPlaying == false && running){
			if(lastPlay + postDelay < Time.fixedTime){
				lastPlay = Time.fixedTime;
				postDelay = UnityEngine.Random.Range(0.5f, 1.5f);
				//queue a new sound
				source.clip = (AudioClip)clips[ Mathf.FloorToInt((float)UnityEngine.Random.Range(0, clips.Length)) ];
				source.Play();
			}
		}
	}
}
