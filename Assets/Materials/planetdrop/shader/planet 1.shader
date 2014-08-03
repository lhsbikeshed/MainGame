Shader "Tom/Planet"
{
    Properties
    {
        _MainTex("Texture (RGB)", 2D) = "black" {}
        _NightTex("NightLights", 2D) = "black" {}
        _Color("Color", Color) = (0, 0, 0, 1)
        _LightCutoff("Light Cut Off", Float) = 1.0
        _AtmoColor("Atmosphere Color", Color) = (0.5, 0.5, 1.0, 1)
        _Size("Size", Float) = 0.1
        _Falloff("Falloff", Float) = 5
        _FalloffPlanet("Falloff Planet", Float) = 5
        _Transparency("Transparency", Float) = 15
        _TransparencyPlanet("Transparency Planet", Float) = 1
        _ViewPos("Camera Position", Vector) = (0.0, 0.0, 0.0)
        _SunPos("Sun position", Vector) = (0.0, 0.0, 0.0)
        
    }
   
	SubShader
    {
        Pass
        {
            Name "PlanetBase"
            Tags {"LightMode" = "Always"}
            Cull Back
           
            CGPROGRAM
                #pragma vertex vert
                #pragma fragment frag
               
                #pragma fragmentoption ARB_fog_exp2
                #pragma fragmentoption ARB_precision_hint_fastest
               
                #include "UnityCG.cginc"
               
                uniform sampler2D _MainTex;
                uniform sampler2D _NightTex;
                uniform float4 _MainTex_ST;
                uniform float4 _Color;
                uniform float4 _AtmoColor;
                uniform float _FalloffPlanet;
                uniform float _LightCutoff;

                uniform float _TransparencyPlanet;
                uniform float4 _ViewPos;
                uniform float4 _SunPos;
               
                struct v2f
                {
                    float4 pos : SV_POSITION;
                    float3 normal : TEXCOORD0;
                    float3 worldvertpos : TEXCOORD1;
                    float2 texcoord : TEXCOORD2;
                };

                v2f vert(appdata_base v)
                {
                    v2f o;
                   
                    o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
                    o.normal = v.normal;
                    o.worldvertpos = mul(_Object2World, v.vertex).xyz;
                    o.texcoord = TRANSFORM_TEX(v.texcoord, _MainTex);
                   
                    return o;
                }
              
                float4 frag(v2f i) : COLOR
                {
                    i.normal = normalize(i.normal);
                    float3 viewdir = normalize(_ViewPos-i.worldvertpos);
                   
                   	
               
               		float lightLevel = dot(normalize(_SunPos - i.worldvertpos), i.normal);
               
               		//blend between these two textures based on light level
               		float4 baseTex = tex2D(_MainTex, i.texcoord)*_Color;
               		
               		
                   	float4 color = baseTex;                 	

                   	/* calculate the atmosphere colour */
                    float4 atmo = _AtmoColor;
                    atmo.a = pow(1.0-saturate(dot(viewdir, i.normal)), _FalloffPlanet);
                    atmo.a *= _TransparencyPlanet*_Color;
                	color.rgb = lerp(color.rgb, atmo.rgb, atmo.a);
                    
                    
                    
                    
                    //color.rgb = lerp(baseTex.rgb, nightColor.rgb, 1.0-lightLevel);
                    
                   	//apply the light level. Somehow dont include
                    color *= lightLevel;
                    //if its in the dark then blend over the light texture
               		float4 nightColor = tex2D(_NightTex, i.texcoord);
               		if(lightLevel < _LightCutoff && nightColor.a > 0.6){
               			color = float4(nightColor.rgb, 1.0) * (1.0-lightLevel) * 0.5;
               		}

                    
               
                    return color;// * lightLevel;
                }
            ENDCG
        }
   
        Pass
        {
            Name "AtmosphereBase"
            Tags {"LightMode" = "Always"}
            
            Cull Front
            Blend SrcAlpha One
           
            CGPROGRAM
                #pragma vertex vert
                #pragma fragment frag
               
                //#pragma fragmentoption ARB_fog_exp2
               // #pragma fragmentoption ARB_precision_hint_fastest
               
                #include "UnityCG.cginc"
               
                uniform float4 _Color;
                uniform float4 _AtmoColor;
                uniform float _Size;
                uniform float _Falloff;
                uniform float _Transparency;
                uniform float4 _ViewPos;
                uniform float4 _SunPos;
               
                struct v2f
                {
                    float4 pos : SV_POSITION;
                    float3 normal : TEXCOORD0;
                    float3 worldvertpos : TEXCOORD1;
                };

                v2f vert(appdata_base v)
                {
                    v2f o;
                   
                    v.vertex.xyz += v.normal*_Size;
                    o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
                    o.normal = v.normal;
                    o.worldvertpos = mul(_Object2World, v.vertex);
                   
                    return o;
                }
              
                float4 frag(v2f i) : COLOR
                {
                    i.normal = normalize(i.normal);
                    float3 viewdir = normalize(i.worldvertpos-_ViewPos);
                   //float3 viewdir = normalize(_ViewPos-i.worldvertpos);

                    float4 color = _AtmoColor;
                    color.a = pow(saturate(dot(viewdir, i.normal)), _Falloff);
                    color.a *= _Transparency*_Color*dot(normalize(_SunPos - i.worldvertpos), i.normal);
                    return color;
                }
            ENDCG
        }
    }
   
    FallBack "Diffuse"
}