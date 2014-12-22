using UnityEngine;
using System.Collections;

public class AudioCrossFader : MonoBehaviour {

	public AudioClip sourceClip1, sourceClip2;
	public AudioSource source1, source2;
	public float mix = 0.0f;

	// Use this for initialization
	void Start () {
		source1 = gameObject.AddComponent<AudioSource>();
		source2 = gameObject.AddComponent<AudioSource>();

		source1.clip = sourceClip1;
		source2.clip = sourceClip2;
		setMix (mix);
	}
	
	public void setMix(float mixIn){
		mix = Mathf.Clamp(mixIn, 0.0f, 1.0f);
		source1.volume = mix;
		source2.volume = 1f - mix;
	}

	public AudioSource getSource(int ind){
		if(ind == 0){
			return source1;
		} else {
			return source2;
		}
	}


}
