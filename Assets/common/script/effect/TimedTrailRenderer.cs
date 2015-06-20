using UnityEngine;
using System.Collections;

public class TimedTrailRenderer : MonoBehaviour 
{
	// Material - Must be a particle material that has the "Tint Color" property
	public Material material;
	Material instanceMaterial;
	
	// Emit
	public bool emit = true;
	bool emittingDone = false;
	
	// Lifetime of each segment
	public float lifeTime = 1;
	float lifeTimeRatio = 1;
	float fadeOutRatio;
	
	// Colors
	public Color[] colors;
	
	// Widths
	public float[] widths;
	
	// Segment creation data
	public float maxAngle = 2;
	public float minVertexDistance = 0.1f;
	public float maxVertexDistance = 1f;
	public float optimizeAngleInterval = 0.1f;
	public float optimizeDistanceInterval = 0.05f;
	public int optimizeCount = 30;
	
	// Object
	GameObject trailObj = null;
	Mesh mesh = null;
	
	// Points
	Point[] points = new Point[100];
	int pointCnt = 0;
	
	void Start ()
	{
		trailObj = new GameObject("Trail");
		trailObj.transform.parent = null;
		trailObj.transform.position = Vector3.zero;
		trailObj.transform.rotation = Quaternion.identity;
		trailObj.transform.localScale = Vector3.one;
		MeshFilter meshFilter = (MeshFilter) trailObj.AddComponent(typeof(MeshFilter));
		mesh = meshFilter.mesh;
		trailObj.AddComponent(typeof(MeshRenderer));
		instanceMaterial = new Material(material);
		fadeOutRatio = 1f / instanceMaterial.GetColor("_TintColor").a;
		trailObj.GetComponent<Renderer>().material = instanceMaterial;
	}
	
	void Update ()
	{
		// Emitting - Designed for one-time use
		if( ! emit )
			emittingDone = true;
		if(emittingDone)
			emit = false;
		
		// Remove expired points
		for(int i = pointCnt-1; i >=0; i--)
		{
			Point point = points[i];
			if(point == null || point.timeAlive > lifeTime)
			{
				points[i] = null;
				pointCnt--;
			}
			else
				break;
		}
		
		// Optimization
		if(pointCnt > optimizeCount)
		{
			maxAngle += optimizeAngleInterval;
			maxVertexDistance += optimizeDistanceInterval;
			optimizeCount += 1;
		}
		
		// Do we add any new points?
		if(emit)
		{
			if(pointCnt == 0)
			{
				points[pointCnt++] = new Point(transform);
				points[pointCnt++] = new Point(transform);
			}
			if(pointCnt == 1)
				insertPoint();
			
			bool add = false;
			float sqrDistance = (points[1].position - transform.position).sqrMagnitude;
			if(sqrDistance > minVertexDistance * minVertexDistance)
			{
				if(sqrDistance > maxVertexDistance * maxVertexDistance)
					add = true;
				else if(Quaternion.Angle(transform.rotation, points[1].rotation) > maxAngle)
					add = true;
			}
			if(add)
			{
				if(pointCnt == points.Length)
					System.Array.Resize(ref points, points.Length + 50);
				insertPoint();
			}
			if( ! add )
				points[0].update(transform);
		}
		
		// Do we render this?
		if(pointCnt < 2)
		{
			trailObj.GetComponent<Renderer>().enabled = false;
			return;
		}
		trailObj.GetComponent<Renderer>().enabled = true;
		
		Color[] meshColors;
		lifeTimeRatio = 1 / lifeTime;
		
		// Do we fade it out?
		if( ! emit )
		{
			if(pointCnt == 0)
				return;
			Color color = instanceMaterial.GetColor("_TintColor");
			color.a -= fadeOutRatio * lifeTimeRatio * Time.deltaTime;
			if(color.a > 0)
				instanceMaterial.SetColor("_TintColor", color);
			else
			{
				Destroy(trailObj);
				Destroy(this);
			}
			return;
		}
		
		// Rebuild it
		Vector3[] vertices = new Vector3[pointCnt * 2];
		Vector2[] uvs = new Vector2[pointCnt * 2];
		int[] triangles = new int[(pointCnt-1) * 6];
		meshColors = new Color[pointCnt * 2];
		
		float uvMultiplier = 1 / (points[pointCnt-1].timeAlive - points[0].timeAlive);
		for(int i = 0; i < pointCnt; i++)
		{
			Point point = points[i];
			float ratio = point.timeAlive * lifeTimeRatio;
			// Color
			Color color;
			if(colors.Length == 0)
				color = Color.Lerp(Color.white, Color.clear, ratio);
			else if(colors.Length == 1)
				color = Color.Lerp(colors[0], Color.clear, ratio);
			else if(colors.Length == 2)
				color = Color.Lerp(colors[0], colors[1], ratio);
			else
			{
				float colorRatio = ratio * (colors.Length-1);
				int min = (int) Mathf.Floor(colorRatio);
				float lerp = Mathf.InverseLerp(min, min+1, colorRatio);
				color = Color.Lerp(colors[min], colors[min+1], lerp);
			}
			meshColors[i * 2] = color;
			meshColors[(i * 2) + 1] = color;
			
			// Width
			float width;
			if(widths.Length == 0)
				width = 1;
			else if(widths.Length == 1)
				width = widths[0];
			else if(widths.Length == 2)
				width = Mathf.Lerp(widths[0], widths[1], ratio);
			else
			{
				float widthRatio = ratio * (widths.Length-1);
				int min = (int) Mathf.Floor(widthRatio);
				float lerp = Mathf.InverseLerp(min, min+1, widthRatio);
				float lerpTo = 0.0f;
				if(min+1 < widths.Length) lerpTo = widths[min + 1];
				width = Mathf.Lerp(widths[min], lerpTo, lerp);
			}
			trailObj.transform.position = point.position;
			trailObj.transform.rotation = point.rotation;
			vertices[i * 2] = trailObj.transform.TransformPoint(0,width*0.5f,0);
			vertices[(i * 2) + 1] = trailObj.transform.TransformPoint(0, -width*0.5f, 0);
			
			// UVs
			float uvRatio;
			uvRatio = (point.timeAlive - points[0].timeAlive) * uvMultiplier;
			uvs[i * 2] = new Vector2(uvRatio , 0);
			uvs[(i * 2) + 1] = new Vector2(uvRatio, 1);
			
			if(i > 0)
			{
				// Triangles
				int triIndex = (i - 1) * 6;
				int vertIndex = i * 2;
				triangles[triIndex+0] = vertIndex - 2;
				triangles[triIndex+1] = vertIndex - 1;
				triangles[triIndex+2] = vertIndex - 0;
				
				triangles[triIndex+3] = vertIndex + 1;
				triangles[triIndex+4] = vertIndex + 0;
				triangles[triIndex+5] = vertIndex - 1;
			}
		}
		trailObj.transform.position = Vector3.zero;
		trailObj.transform.rotation = Quaternion.identity;
		mesh.Clear();
		mesh.vertices = vertices;
		mesh.colors = meshColors;
		mesh.uv = uvs;
		mesh.triangles = triangles;
	}
	
	void insertPoint()
	{
		for(int i = pointCnt; i > 0; i--)
			points[i] = points[i-1];
		points[0] = new Point(transform);
		pointCnt++;
	}

	public void translateAll(Vector3 offset){
		for(int i = 0; i < pointCnt; i++){
			points[i].position += offset;
		}
	
	}
	
	class Point
	{
		public float timeCreated = 0;
		public float timeAlive
		{
			get { return Time.time - timeCreated; }
		}
		public float fadeAlpha = 0;
		public Vector3 position = Vector3.zero;
		public Quaternion rotation = Quaternion.identity;
		public Point(Transform trans)
		{
			position = trans.position;
			rotation = trans.rotation;
			timeCreated = Time.time;
		}
		public void update(Transform trans)
		{
			position = trans.position;
			rotation = trans.rotation;
			timeCreated = Time.time;
		}
	}
}