Shader "Custom/HudShader2" {
	Properties {
		_Color ("Main Color", Color) = (1.0, 0.0, 0.0, 1.0) 
		_ScaleSize ("scale", Float) = 1.5 
		

	}
	 SubShader {
        Pass {
        	ZWrite Off
    		Blend SrcAlpha OneMinusSrcAlpha
           	CGPROGRAM
			// Upgrade NOTE: excluded shader from Xbox360; has structs without semantics (struct v2f members passPos)
			#pragma exclude_renderers xbox360

			#pragma vertex vert
			#pragma fragment frag
			#include "UnityCG.cginc"
			float4 _Color;
			float _ScaleSize;
			
			
			struct v2f {
			    float4 pos : SV_POSITION;
			    float3 normal : TEXCOORD0;
                float3 worldvertpos : TEXCOORD1;
			};
			
			v2f vert (appdata_base v)
			{
			    v2f o;
			    v.vertex.xyz += v.normal * _ScaleSize;
			    o.pos = mul (UNITY_MATRIX_MVP, v.vertex) ;
			    o.normal = v.normal;
                o.worldvertpos = mul(_Object2World, v.vertex).xyz;
			    
			   
			    
			    return o;
			}
			 
			half4 frag (v2f i) : COLOR
			{
				i.normal = normalize(i.normal);
                float3 viewdir = normalize(_WorldSpaceCameraPos-i.worldvertpos);
               
              	float normalShade =  1.0 - dot(viewdir, i.normal);
              	if(normalShade < 0.9){
              		
              		normalShade = 0.3;
              	}
				
			
			    return _Color * normalShade;
			}
			ENDCG
        }
    }
}
