// Unlit alpha-blended shader.
// - no lighting
// - no lightmap support
// - no per-material color

Shader "Custom/ScannerShader" {
Properties {
	_MainTex ("Texture", 2D) = "white" {}
	_Color ("Main Color", Color) = (1,1,1,0.5)
}

SubShader {
	Tags {"Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent"}
	LOD 100
	
	ZWrite Off
	Blend SrcAlpha OneMinusSrcAlpha 

	Pass {
		CGPROGRAM
		#pragma vertex vert
		#pragma fragment frag
		#include "UnityCG.cginc"
		sampler2D _MainTex;
		float4 _MainTex_ST;
		float4 _Color;
		struct v2f {
		    float4 pos : SV_POSITION;
		    float3 color : COLOR0;
		    float2  uv : TEXCOORD0;
		};
		
		v2f vert (appdata_base v)
		{
		    v2f o;
		    o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
		    o.uv = TRANSFORM_TEX (v.texcoord, _MainTex);
		    return o;
		}
		
		half4 frag (v2f i) : COLOR
		{
	        half4 texcol = tex2D (_MainTex, i.uv);
    		return texcol * _Color;
		}
		ENDCG

	}
}
}
