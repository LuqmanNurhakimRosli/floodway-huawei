"""
Generates 5 high-quality, vibrant 2D anime-style SVG avatars for the FloodWay family circle:
1. You (Protagonist, blue theme)
2. Abang Ali (Brother, green theme)
3. Kakak Siti (Sister with modern hijab, purple theme)
4. Emak (Mother with elegant hijab, rose pink theme)
5. Ayah (Father with anime glasses & warm smile, amber theme)
"""
import os

AVATAR_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'media', 'avatars')
os.makedirs(AVATAR_DIR, exist_ok=True)

# 1. YOU
SVG_YOU = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-you" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="hair-you" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2D3748"/>
      <stop offset="60%" stop-color="#1A202C"/>
      <stop offset="100%" stop-color="#0D1117"/>
    </linearGradient>
    <linearGradient id="hair-shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#60A5FA" stop-opacity="0"/>
      <stop offset="50%" stop-color="#93C5FD" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#60A5FA" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="eye-you" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="40%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#60A5FA"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFEED9"/>
      <stop offset="100%" stop-color="#FCD5B5"/>
    </linearGradient>
    <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F7BA94"/>
      <stop offset="100%" stop-color="#EAA178"/>
    </linearGradient>
    <linearGradient id="jacket-you" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Background Circle -->
    <rect width="256" height="256" fill="url(#bg-you)"/>
    <!-- Subtle Speed / Anime Accent lines in bg -->
    <path d="M-20 60 L140 -20" stroke="#60A5FA" stroke-width="2" opacity="0.25"/>
    <path d="M60 270 L280 150" stroke="#60A5FA" stroke-width="3" opacity="0.2"/>
    <circle cx="210" cy="50" r="30" fill="#38BDF8" opacity="0.15"/>

    <!-- Shoulders & Clothing -->
    <path d="M40 256 Q48 200 100 188 L128 208 L156 188 Q208 200 216 256 Z" fill="url(#jacket-you)"/>
    <!-- Jacket Collar & Inner Tee -->
    <path d="M102 188 L128 226 L154 188 Z" fill="#2563EB"/>
    <path d="M112 188 L128 214 L144 188 Z" fill="#F8FAFC"/>
    <path d="M78 205 Q128 222 178 205" stroke="#38BDF8" stroke-width="2.5" fill="none" opacity="0.8"/>
    <!-- Lanyard / Tech ID ribbon -->
    <path d="M120 214 L120 256 M136 214 L136 256" stroke="#38BDF8" stroke-width="3"/>

    <!-- Neck -->
    <path d="M110 162 L110 196 Q128 204 146 196 L146 162 Z" fill="url(#skin)"/>
    <!-- Neck Shadow -->
    <path d="M110 162 Q128 178 146 162 L146 172 Q128 186 110 172 Z" fill="url(#skin-shadow)"/>

    <!-- Face Base -->
    <path d="M82 110 Q80 155 128 178 Q176 155 174 110 Q174 74 128 74 Q82 74 82 110 Z" fill="url(#skin)"/>
    <!-- Cheeks Blush -->
    <ellipse cx="98" cy="138" rx="11" ry="5.5" fill="#F43F5E" opacity="0.3"/>
    <ellipse cx="158" cy="138" rx="11" ry="5.5" fill="#F43F5E" opacity="0.3"/>
    <path d="M93 138 L97 134 M97 139 L101 135" stroke="#F43F5E" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M153 138 L157 134 M157 139 L161 135" stroke="#F43F5E" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>

    <!-- Anime Nose -->
    <path d="M127 135 L129 139 L126 140" stroke="#C27855" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Cheerful Anime Mouth -->
    <path d="M116 150 Q128 164 140 150 Q128 154 116 150 Z" fill="#BE123C"/>
    <path d="M120 152 Q128 158 136 152" fill="#FFFFFF"/>

    <!-- Left Eye -->
    <g id="eye-l">
      <!-- Upper Lash Line -->
      <path d="M92 121 Q105 113 115 122" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <!-- Eye Iris -->
      <ellipse cx="104" cy="126" rx="9" ry="11" fill="url(#eye-you)"/>
      <ellipse cx="104" cy="126" rx="4.5" ry="5.5" fill="#0B132B"/>
      <!-- Highlights -->
      <circle cx="101" cy="121" r="3.5" fill="#FFFFFF"/>
      <circle cx="107" cy="131" r="1.8" fill="#FFFFFF"/>
      <!-- Lower Lash line -->
      <path d="M96 135 Q104 139 111 135" stroke="#0F172A" stroke-width="1.5" fill="none"/>
      <!-- Eyebrow -->
      <path d="M90 108 Q102 101 115 107" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Right Eye -->
    <g id="eye-r">
      <path d="M141 122 Q151 113 164 121" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <ellipse cx="152" cy="126" rx="9" ry="11" fill="url(#eye-you)"/>
      <ellipse cx="152" cy="126" rx="4.5" ry="5.5" fill="#0B132B"/>
      <circle cx="149" cy="121" r="3.5" fill="#FFFFFF"/>
      <circle cx="155" cy="131" r="1.8" fill="#FFFFFF"/>
      <path d="M145 135 Q152 139 160 135" stroke="#0F172A" stroke-width="1.5" fill="none"/>
      <path d="M141 107 Q154 101 166 108" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Ears -->
    <path d="M82 120 Q74 125 76 136 Q78 144 84 142" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>
    <path d="M174 120 Q182 125 180 136 Q178 144 172 142" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>

    <!-- Anime Hair (Dynamic Bangs & Layers) -->
    <g fill="url(#hair-you)">
      <!-- Back hair volume -->
      <path d="M68 110 Q66 60 128 50 Q190 60 188 110 Q198 128 184 148 Q174 110 174 95 Q128 75 82 95 Q82 110 72 148 Q58 128 68 110 Z"/>
      <!-- Front Bangs Swept Right -->
      <path d="M72 90 Q90 98 100 114 Q94 92 115 88 Q125 106 130 118 Q128 92 148 94 Q156 108 160 120 Q160 90 180 94 Q172 82 165 74 Q128 58 72 90 Z"/>
      <!-- Side Strands -->
      <path d="M78 98 Q76 130 84 142 Q86 122 86 110 Z"/>
      <path d="M178 98 Q180 130 172 142 Q170 122 170 110 Z"/>
      <!-- Top spikes -->
      <path d="M110 56 Q118 42 126 46 Q122 52 128 54 Z"/>
      <path d="M130 52 Q144 42 148 50 Q140 54 142 60 Z"/>
    </g>

    <!-- Hair Specular Sheen (Anime light ring across bangs) -->
    <path d="M88 88 Q128 80 168 88 Q128 84 88 88 Z" fill="url(#hair-shine)"/>
    <ellipse cx="106" cy="84" rx="10" ry="3" fill="#60A5FA" opacity="0.6" transform="rotate(-6 106 84)"/>
    <ellipse cx="146" cy="85" rx="12" ry="3" fill="#60A5FA" opacity="0.6" transform="rotate(6 146 85)"/>
  </g>
</svg>'''

# 2. ABANG ALI
SVG_ABANG_ALI = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-ali" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="60%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
    <linearGradient id="hair-ali" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="eye-ali" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#6EE7B7"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFECD1"/>
      <stop offset="100%" stop-color="#F9CAA7"/>
    </linearGradient>
    <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F2AE80"/>
      <stop offset="100%" stop-color="#E28E5A"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Background -->
    <rect width="256" height="256" fill="url(#bg-ali)"/>
    <circle cx="40" cy="50" r="35" fill="#34D399" opacity="0.2"/>
    <path d="M0 200 L260 80" stroke="#34D399" stroke-width="3" opacity="0.25"/>

    <!-- Sporty Hoodie / Polo -->
    <path d="M36 256 Q44 196 96 186 L128 206 L160 186 Q212 196 220 256 Z" fill="#047857"/>
    <path d="M98 186 L128 226 L158 186 Z" fill="#065F46"/>
    <path d="M110 186 L128 212 L146 186 Z" fill="#F0FDF4"/>
    <!-- Sport stripe -->
    <path d="M52 235 L96 186 M204 235 L160 186" stroke="#34D399" stroke-width="4" stroke-linecap="round"/>

    <!-- Neck -->
    <path d="M110 158 L110 196 Q128 204 146 196 L146 158 Z" fill="url(#skin)"/>
    <path d="M110 158 Q128 174 146 158 L146 168 Q128 182 110 168 Z" fill="url(#skin-shadow)"/>

    <!-- Jaw & Face -->
    <path d="M80 106 Q78 152 128 176 Q178 152 176 106 Q176 72 128 72 Q80 72 80 106 Z" fill="url(#skin)"/>
    <ellipse cx="96" cy="135" rx="10" ry="5" fill="#F43F5E" opacity="0.25"/>
    <ellipse cx="160" cy="135" rx="10" ry="5" fill="#F43F5E" opacity="0.25"/>

    <!-- Nose -->
    <path d="M127 131 L129 136 L126 137" stroke="#C27855" stroke-width="1.6" stroke-linecap="round" fill="none"/>

    <!-- Confident anime grin with teeth sparkle -->
    <path d="M112 147 Q128 165 146 147 Q128 150 112 147 Z" fill="#881337"/>
    <path d="M116 149 Q128 157 142 149 Z" fill="#FFFFFF"/>
    <!-- Tooth star sparkle -->
    <path d="M142 146 L144 142 L146 146 L150 148 L146 150 L144 154 L142 150 L138 148 Z" fill="#FEF08A"/>

    <!-- Left Eye (Open, determined & friendly) -->
    <g id="ali-eye-l">
      <path d="M88 118 Q102 109 116 119" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <ellipse cx="103" cy="124" rx="8.5" ry="10.5" fill="url(#eye-ali)"/>
      <ellipse cx="103" cy="124" rx="4" ry="5" fill="#022C22"/>
      <circle cx="100" cy="120" r="3.2" fill="#FFFFFF"/>
      <circle cx="106" cy="128" r="1.6" fill="#FFFFFF"/>
      <path d="M93 133 Q102 136 111 133" stroke="#0F172A" stroke-width="1.5" fill="none"/>
      <path d="M86 104 Q100 97 114 104" stroke="#1E293B" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Right Eye (Charismatic anime wink! 😉) -->
    <g id="ali-eye-r">
      <path d="M140 125 Q152 113 166 124" stroke="#0F172A" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M140 125 Q152 133 166 124" stroke="#0F172A" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Cheek crease for wink -->
      <path d="M150 133 Q156 136 162 133" stroke="#F43F5E" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M142 104 Q156 97 168 106" stroke="#1E293B" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Ears -->
    <path d="M80 116 Q72 122 74 133 Q76 141 82 139" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>
    <path d="M176 116 Q184 122 182 133 Q180 141 174 139" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>

    <!-- Anime Spiky Hair (Cool elder brother hairstyle) -->
    <g fill="url(#hair-ali)">
      <!-- Silhouette -->
      <path d="M64 106 Q62 50 128 42 Q194 50 192 106 Q200 122 188 138 Q176 102 176 88 Q128 66 80 88 Q80 102 68 138 Q56 122 64 106 Z"/>
      <!-- Dynamic Spikes on Top -->
      <path d="M96 56 L108 30 L118 48 L134 26 L144 46 L160 32 L166 56 Z"/>
      <path d="M64 92 L50 78 L72 74 L60 60 L84 62 Z"/>
      <path d="M192 92 L206 78 L184 74 L196 60 L172 62 Z"/>
      <!-- Forehead bangs -->
      <path d="M78 86 Q96 92 106 108 Q104 88 122 84 Q132 100 138 110 Q138 86 156 88 Q164 100 168 112 Q172 84 184 88 Z"/>
    </g>

    <!-- Hair Sheen -->
    <ellipse cx="128" cy="72" rx="30" ry="6" fill="#34D399" opacity="0.45"/>
    <ellipse cx="106" cy="68" rx="8" ry="3" fill="#A7F3D0" opacity="0.7"/>
    <ellipse cx="150" cy="70" rx="10" ry="3" fill="#A7F3D0" opacity="0.7"/>
  </g>
</svg>'''

# 3. KAKAK SITI (Modern Anime Hijab Girl, Purple theme)
SVG_KAKAK_SITI = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-siti" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#3B0764"/>
    </linearGradient>
    <linearGradient id="tudung-siti" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E9D5FF"/>
      <stop offset="50%" stop-color="#C084FC"/>
      <stop offset="100%" stop-color="#9333EA"/>
    </linearGradient>
    <linearGradient id="inner-cap" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#581C87"/>
      <stop offset="100%" stop-color="#3B0764"/>
    </linearGradient>
    <linearGradient id="eye-siti" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#581C87"/>
      <stop offset="50%" stop-color="#9333EA"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF1E6"/>
      <stop offset="100%" stop-color="#FED7AA"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Background -->
    <rect width="256" height="256" fill="url(#bg-siti)"/>
    <!-- Cute anime sparkle background elements -->
    <circle cx="210" cy="60" r="4" fill="#FDF4FF"/>
    <circle cx="50" cy="70" r="3" fill="#FDF4FF"/>
    <circle cx="200" cy="180" r="3.5" fill="#FDF4FF"/>
    <path d="M210 50 L212 56 L218 58 L212 60 L210 66 L208 60 L202 58 L208 56 Z" fill="#F5D0FE"/>
    <path d="M46 64 L48 68 L52 70 L48 72 L46 76 L44 72 L40 70 L44 68 Z" fill="#F5D0FE"/>

    <!-- Shoulders & Hijab drape -->
    <path d="M30 256 Q38 184 94 172 Q128 164 162 172 Q218 184 226 256 Z" fill="url(#tudung-siti)"/>
    <!-- Hijab drape folds -->
    <path d="M94 172 Q128 200 162 172 Q140 220 128 256 Q116 220 94 172 Z" fill="#7E22CE" opacity="0.4"/>
    <path d="M128 178 Q144 210 152 256" stroke="#E9D5FF" stroke-width="2" fill="none" opacity="0.6"/>

    <!-- Cute Gold Brooch Pin -->
    <circle cx="128" cy="182" r="7" fill="#FBBF24"/>
    <circle cx="128" cy="182" r="4" fill="#F59E0B"/>
    <circle cx="128" cy="182" r="2" fill="#FEF08A"/>

    <!-- Outer Hijab Framing Head -->
    <path d="M60 114 Q56 42 128 34 Q200 42 196 114 Q196 166 160 178 Q128 184 96 178 Q60 166 60 114 Z" fill="url(#tudung-siti)"/>

    <!-- Inner Tudung Cap (Anak Tudung) showing neatly on forehead -->
    <path d="M88 88 Q128 72 168 88 Q128 80 88 88 Z" fill="url(#inner-cap)"/>

    <!-- Face Opening -->
    <path d="M88 92 Q84 136 128 166 Q172 136 168 92 Q128 84 88 92 Z" fill="url(#skin)"/>

    <!-- Soft Cheeks Blush -->
    <ellipse cx="102" cy="136" rx="12" ry="6" fill="#FB7185" opacity="0.35"/>
    <ellipse cx="154" cy="136" rx="12" ry="6" fill="#FB7185" opacity="0.35"/>
    <path d="M98 136 L102 132 M103 137 L107 133" stroke="#E11D48" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M149 136 L153 132 M154 137 L158 133" stroke="#E11D48" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>

    <!-- Petite Anime Nose -->
    <circle cx="128" cy="133" r="1.5" fill="#E11D48" opacity="0.6"/>

    <!-- Sweet Anime Smile with soft lip gloss -->
    <path d="M118 147 Q128 156 138 147" stroke="#BE123C" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="128" cy="150" rx="3" ry="1.2" fill="#FDA4AF"/>

    <!-- Left Anime Eye (Big Shoujo style sparkling!) -->
    <g id="siti-eye-l">
      <!-- Eyelashes & Upper Lid -->
      <path d="M92 118 Q105 107 118 117" stroke="#3B0764" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M115 112 L120 107" stroke="#3B0764" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M94 114 L89 110" stroke="#3B0764" stroke-width="2" stroke-linecap="round"/>
      <!-- Iris -->
      <ellipse cx="105" cy="123" rx="10" ry="12" fill="url(#eye-siti)"/>
      <ellipse cx="105" cy="123" rx="5" ry="6" fill="#2E1065"/>
      <!-- Highlights -->
      <ellipse cx="101" cy="117" rx="4" ry="4.5" fill="#FFFFFF"/>
      <circle cx="109" cy="127" r="2.2" fill="#FFFFFF"/>
      <circle cx="102" cy="129" r="1.2" fill="#FDF4FF"/>
      <!-- Lower Lid -->
      <path d="M97 133 Q105 137 113 133" stroke="#581C87" stroke-width="1.5" fill="none"/>
      <!-- Soft arched eyebrow -->
      <path d="M92 103 Q104 96 116 103" stroke="#6B21A8" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Right Anime Eye -->
    <g id="siti-eye-r">
      <path d="M138 117 Q151 107 164 118" stroke="#3B0764" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M141 112 L136 107" stroke="#3B0764" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M162 114 L167 110" stroke="#3B0764" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="151" cy="123" rx="10" ry="12" fill="url(#eye-siti)"/>
      <ellipse cx="151" cy="123" rx="5" ry="6" fill="#2E1065"/>
      <ellipse cx="147" cy="117" rx="4" ry="4.5" fill="#FFFFFF"/>
      <circle cx="155" cy="127" r="2.2" fill="#FFFFFF"/>
      <circle cx="148" cy="129" r="1.2" fill="#FDF4FF"/>
      <path d="M143 133 Q151 137 159 133" stroke="#581C87" stroke-width="1.5" fill="none"/>
      <path d="M140 103 Q152 96 164 103" stroke="#6B21A8" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Hijab Front Fold Shadow around chin -->
    <path d="M88 92 Q80 134 116 168 Q128 178 140 168 Q176 134 168 92 Q176 138 136 174 Q128 180 120 174 Q80 138 88 92 Z" fill="#6B21A8" opacity="0.3"/>
  </g>
</svg>'''

# 4. EMAK (Loving Anime Mother, Rose Pink theme)
SVG_EMAK = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-emak" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="50%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <linearGradient id="tudung-emak" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE4E6"/>
      <stop offset="50%" stop-color="#FDA4AF"/>
      <stop offset="100%" stop-color="#F43F5E"/>
    </linearGradient>
    <linearGradient id="eye-emak" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4C0519"/>
      <stop offset="50%" stop-color="#9F1239"/>
      <stop offset="100%" stop-color="#E11D48"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5EB"/>
      <stop offset="100%" stop-color="#FED7AA"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Background -->
    <rect width="256" height="256" fill="url(#bg-emak)"/>
    <!-- Warm floating flower petals / warm glow -->
    <circle cx="45" cy="55" r="28" fill="#FDA4AF" opacity="0.25"/>
    <circle cx="215" cy="190" r="32" fill="#FDA4AF" opacity="0.2"/>
    <ellipse cx="200" cy="50" rx="8" ry="4" fill="#FFE4E6" opacity="0.4" transform="rotate(25 200 50)"/>
    <ellipse cx="60" cy="200" rx="9" ry="5" fill="#FFE4E6" opacity="0.4" transform="rotate(-30 60 200)"/>

    <!-- Hijab Shoulders & Baju Kurung neckline -->
    <path d="M28 256 Q36 186 92 174 Q128 166 164 174 Q220 186 228 256 Z" fill="url(#tudung-emak)"/>
    <path d="M96 174 Q128 202 160 174 Q138 226 128 256 Q118 226 96 174 Z" fill="#BE123C" opacity="0.35"/>

    <!-- Pearl Brooch -->
    <circle cx="128" cy="180" r="8" fill="#FFFFFF" stroke="#E11D48" stroke-width="1.5"/>
    <circle cx="128" cy="180" r="5" fill="#FFE4E6"/>
    <circle cx="126" cy="178" r="2" fill="#FFFFFF"/>

    <!-- Outer Tudung Framing Head -->
    <path d="M58 114 Q54 40 128 32 Q202 40 198 114 Q198 168 162 178 Q128 186 94 178 Q58 168 58 114 Z" fill="url(#tudung-emak)"/>

    <!-- Inner Tudung Accent line -->
    <path d="M86 88 Q128 74 170 88 Q128 82 86 88 Z" fill="#9F1239"/>

    <!-- Face Area -->
    <path d="M86 92 Q82 136 128 166 Q174 136 170 92 Q128 84 86 92 Z" fill="url(#skin)"/>

    <!-- Motherly Soft Cheeks Blush -->
    <ellipse cx="102" cy="136" rx="13" ry="7" fill="#FB7185" opacity="0.35"/>
    <ellipse cx="154" cy="136" rx="13" ry="7" fill="#FB7185" opacity="0.35"/>

    <!-- Nose -->
    <path d="M127 132 Q129 136 127 137" stroke="#C27855" stroke-width="1.6" stroke-linecap="round" fill="none"/>

    <!-- Warm, Gentle, Kind Mother Smile -->
    <path d="M116 146 Q128 156 140 146" stroke="#9F1239" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    <ellipse cx="128" cy="149" rx="3.5" ry="1.4" fill="#FDA4AF"/>

    <!-- Left Eye (Kind, gentle curved anime eyes of a loving mother) -->
    <g id="emak-eye-l">
      <!-- Curved gentle anime smile-eye arc -->
      <path d="M92 118 Q105 110 118 119" stroke="#4C0519" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <!-- Soft iris visible through gentle smile -->
      <ellipse cx="105" cy="124" rx="8.5" ry="9" fill="url(#eye-emak)"/>
      <ellipse cx="105" cy="124" rx="4" ry="4.5" fill="#4C0519"/>
      <circle cx="102" cy="120" r="3" fill="#FFFFFF"/>
      <circle cx="108" cy="126" r="1.5" fill="#FFFFFF"/>
      <path d="M96 132 Q105 135 114 132" stroke="#9F1239" stroke-width="1.4" fill="none"/>
      <!-- Graceful arched eyebrow -->
      <path d="M91 104 Q104 98 117 106" stroke="#881337" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Right Eye -->
    <g id="emak-eye-r">
      <path d="M138 119 Q151 110 164 118" stroke="#4C0519" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <ellipse cx="151" cy="124" rx="8.5" ry="9" fill="url(#eye-emak)"/>
      <ellipse cx="151" cy="124" rx="4" ry="4.5" fill="#4C0519"/>
      <circle cx="148" cy="120" r="3" fill="#FFFFFF"/>
      <circle cx="154" cy="126" r="1.5" fill="#FFFFFF"/>
      <path d="M142 132 Q151 135 160 132" stroke="#9F1239" stroke-width="1.4" fill="none"/>
      <path d="M139 106 Q152 98 165 104" stroke="#881337" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Hijab Soft Fold Shadows -->
    <path d="M86 92 Q78 134 116 168 Q128 178 140 168 Q178 134 170 92 Q178 138 136 174 Q128 180 120 174 Q78 138 86 92 Z" fill="#9F1239" opacity="0.3"/>
  </g>
</svg>'''

# 5. AYAH (Dignified Anime Father, Amber/Gold theme, Smart Glasses)
SVG_AYAH = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-ayah" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
    <linearGradient id="hair-ayah" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="eye-ayah" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#78350F"/>
      <stop offset="50%" stop-color="#B45309"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFECD1"/>
      <stop offset="100%" stop-color="#F5C09B"/>
    </linearGradient>
    <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EAA67C"/>
      <stop offset="100%" stop-color="#D88656"/>
    </linearGradient>
    <clipPath id="circle-clip">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Background -->
    <rect width="256" height="256" fill="url(#bg-ayah)"/>
    <circle cx="210" cy="50" r="32" fill="#FDE68A" opacity="0.2"/>
    <path d="M-10 180 L260 90" stroke="#FBBF24" stroke-width="2.5" opacity="0.25"/>

    <!-- Shirt & Collar -->
    <path d="M36 256 Q44 196 96 186 L128 206 L160 186 Q212 196 220 256 Z" fill="#1E293B"/>
    <!-- Collared Polo / Shirt -->
    <path d="M98 186 L128 228 L158 186 Z" fill="#B45309"/>
    <path d="M110 186 L128 214 L146 186 Z" fill="#FFFBEB"/>

    <!-- Neck -->
    <path d="M108 158 L108 196 Q128 204 148 196 L148 158 Z" fill="url(#skin)"/>
    <path d="M108 158 Q128 174 148 158 L148 168 Q128 182 108 168 Z" fill="url(#skin-shadow)"/>

    <!-- Jaw & Face -->
    <path d="M78 106 Q76 156 128 178 Q180 156 178 106 Q178 72 128 72 Q78 72 78 106 Z" fill="url(#skin)"/>

    <!-- Nose -->
    <path d="M126 128 L129 135 L125 137" stroke="#C27855" stroke-width="1.8" stroke-linecap="round" fill="none"/>

    <!-- Father's Neat Mustache (Sophisticated Anime Father look) -->
    <path d="M118 144 Q128 141 138 144 Q134 148 128 146 Q122 148 118 144 Z" fill="#334155"/>

    <!-- Warm Dependable Smile -->
    <path d="M116 152 Q128 162 140 152" stroke="#9A3412" stroke-width="2.4" stroke-linecap="round" fill="none"/>

    <!-- Ears -->
    <path d="M78 116 Q70 122 72 133 Q74 141 80 139" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>
    <path d="M178 116 Q186 122 184 133 Q182 141 176 139" fill="url(#skin)" stroke="#C27855" stroke-width="1.5"/>

    <!-- Left Eye Behind Glasses -->
    <g id="ayah-eye-l">
      <path d="M92 118 Q104 110 116 119" stroke="#0F172A" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="104" cy="124" rx="8" ry="9.5" fill="url(#eye-ayah)"/>
      <ellipse cx="104" cy="124" rx="4" ry="4.5" fill="#451A03"/>
      <circle cx="101" cy="120" r="3" fill="#FFFFFF"/>
      <circle cx="107" cy="127" r="1.5" fill="#FFFFFF"/>
      <path d="M96 132 Q104 135 112 132" stroke="#0F172A" stroke-width="1.4" fill="none"/>
      <!-- Eyebrow -->
      <path d="M88 103 Q102 96 116 104" stroke="#334155" stroke-width="3.8" stroke-linecap="round" fill="none"/>
      <!-- Soft smile crinkle at outer corner -->
      <path d="M88 120 L84 122" stroke="#C27855" stroke-width="1.2" stroke-linecap="round"/>
    </g>

    <!-- Right Eye Behind Glasses -->
    <g id="ayah-eye-r">
      <path d="M140 119 Q152 110 164 118" stroke="#0F172A" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="152" cy="124" rx="8" ry="9.5" fill="url(#eye-ayah)"/>
      <ellipse cx="152" cy="124" rx="4" ry="4.5" fill="#451A03"/>
      <circle cx="149" cy="120" r="3" fill="#FFFFFF"/>
      <circle cx="155" cy="127" r="1.5" fill="#FFFFFF"/>
      <path d="M144 132 Q152 135 160 132" stroke="#0F172A" stroke-width="1.4" fill="none"/>
      <path d="M140 104 Q154 96 168 103" stroke="#334155" stroke-width="3.8" stroke-linecap="round" fill="none"/>
      <path d="M168 120 L172 122" stroke="#C27855" stroke-width="1.2" stroke-linecap="round"/>
    </g>

    <!-- Stylish Modern Anime Glasses (Semi-rimless metallic) -->
    <g stroke="#FBBF24" stroke-width="2.5" fill="none" opacity="0.95">
      <!-- Left frame -->
      <rect x="88" y="110" width="32" height="24" rx="6" stroke="#475569" stroke-width="2"/>
      <line x1="88" y1="110" x2="120" y2="110" stroke="#F59E0B" stroke-width="3"/>
      <!-- Right frame -->
      <rect x="136" y="110" width="32" height="24" rx="6" stroke="#475569" stroke-width="2"/>
      <line x1="136" y1="110" x2="168" y2="110" stroke="#F59E0B" stroke-width="3"/>
      <!-- Bridge & Temples -->
      <path d="M120 116 Q128 114 136 116" stroke="#F59E0B" stroke-width="2.5"/>
      <line x1="88" y1="116" x2="78" y2="118" stroke="#475569" stroke-width="2"/>
      <line x1="168" y1="116" x2="178" y2="118" stroke="#475569" stroke-width="2"/>
      <!-- Glass reflection glint -->
      <line x1="94" y1="114" x2="102" y2="128" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6"/>
      <line x1="142" y1="114" x2="150" y2="128" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6"/>
    </g>

    <!-- Neat Anime Hair (Mature, handsome parted hair with silver streaks) -->
    <g fill="url(#hair-ayah)">
      <path d="M66 106 Q64 48 128 40 Q192 48 190 106 Q198 122 186 138 Q176 100 176 86 Q128 64 80 86 Q80 100 70 138 Q58 122 66 106 Z"/>
      <!-- Parted side sweep -->
      <path d="M78 86 Q96 90 108 104 Q106 84 122 80 Q138 92 144 104 Q146 84 162 86 Q170 96 174 108 Q174 82 186 86 Z"/>
      <!-- Silver grey highlights at temples (distinguished) -->
      <path d="M72 104 Q76 86 86 80" stroke="#94A3B8" stroke-width="2" fill="none"/>
      <path d="M184 104 Q180 86 170 80" stroke="#94A3B8" stroke-width="2" fill="none"/>
    </g>
    <!-- Top Hair Sheen -->
    <ellipse cx="128" cy="64" rx="26" ry="5" fill="#94A3B8" opacity="0.35"/>
  </g>
</svg>'''

files = {
    'avatar-you.svg': SVG_YOU,
    'avatar-abangali.svg': SVG_ABANG_ALI,
    'avatar-kaksiti.svg': SVG_KAKAK_SITI,
    'avatar-emak.svg': SVG_EMAK,
    'avatar-ayah.svg': SVG_AYAH,
}

for filename, content in files.items():
    filepath = os.path.join(AVATAR_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f'Wrote {filepath} ({len(content)} bytes)')
