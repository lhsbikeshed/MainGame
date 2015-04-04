using UnityEngine;
using System.Collections;

public class IceEffect : MonoBehaviour {

	Material mat;

	public float freezeAmount = 0.0f;

	// Use this for initialization
	void Start () {
		mat = GetComponent<Renderer> ().material;

	}
	
	// Update is called once per frame
	void Update () {
		freezeAmount = Mathf.Clamp (freezeAmount, 0.0f, 1.0f);
		mat.SetFloat ("_BlendAmount", 1.0f - freezeAmount);
	
	}
}
