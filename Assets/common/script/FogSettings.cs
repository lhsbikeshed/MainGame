using UnityEngine;
using System;

[RequireComponent(typeof(Camera))]
[AddComponentMenu("Rendering/Fog Layer")]

public class FogSettings:MonoBehaviour{
	/*
	 This script lets you enable and disable per camera.
	 By enabling or disabling the script in the title of the inspector, you can turn fog on or off per camera.
	*/
	 
	bool revertFogState = false;
	 
	public void OnPreRender() {
		revertFogState = RenderSettings.fog;
		RenderSettings.fog = enabled;
	}
	 
	public void OnPostRender() {
		RenderSettings.fog = revertFogState;
	}
	 

}