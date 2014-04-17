using UnityEngine;
using UnityEditor;
using System.Collections;

public static class RecursiveEditor
{
	[MenuItem("GameObject/Set Active Recursively")]
	public static void ToggleActive ()
	{
		if (Selection.activeTransform == null)
			return;
		
		ToggleActiveRecursively(Selection.activeTransform, !Selection.activeGameObject.activeSelf);
	}
	
	static void ToggleActiveRecursively (Transform trans, bool active)
	{
		trans.gameObject.SetActive(active);
		foreach (Transform child in trans)
			ToggleActiveRecursively(child, active);
	}
}