/*
 This script lets you enable and disable per camera.
 By enabling or disabling the script in the title of the inspector, you can turn fog on or off per camera.
*/
 
private var revertFogState = false;
 
function OnPreRender () {
	revertFogState = RenderSettings.fog;
	RenderSettings.fog = enabled;
}
 
function OnPostRender () {
	RenderSettings.fog = revertFogState;
}
 
@script AddComponentMenu ("Rendering/Fog Layer")
@script RequireComponent (Camera)